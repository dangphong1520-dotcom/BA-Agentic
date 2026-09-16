import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  decisionDtoSchema,
  type CreateDecision,
  type UpdateDecision,
} from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';
import type { Prisma } from '../generated/prisma/client.js';

const withRequirements = {
  requirements: { select: { requirementId: true } },
} as const;
type DecisionRow = Prisma.DecisionGetPayload<{
  include: typeof withRequirements;
}>;

@Injectable()
export class DecisionRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  list(workspaceId: string, projectId: string) {
    return this.database.db.decision.findMany({
      where: { workspaceId, projectId },
      include: withRequirements,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }

  get(workspaceId: string, projectId: string, id: string) {
    return this.database.db.decision.findFirst({
      where: { id, workspaceId, projectId },
      include: withRequirements,
    });
  }

  history(id: string) {
    return this.database.db.decisionVersion.findMany({
      where: { decisionId: id },
      orderBy: { version: 'desc' },
      take: 100,
    });
  }

  private snapshot(row: DecisionRow) {
    const { requirements, ...fields } = row;
    return decisionDtoSchema.parse({
      ...fields,
      requirementIds: requirements.map((item) => item.requirementId),
      decisionDate: row.decisionDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  create(
    userId: string,
    workspaceId: string,
    projectId: string,
    data: CreateDecision,
  ) {
    const id = randomUUID();
    const code = `DEC-${id.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    const { requirementIds, ...fields } = data;
    return this.database.db.$transaction(async (tx) => {
      const row = await tx.decision.create({
        data: {
          id,
          code,
          ...fields,
          workspaceId,
          projectId,
          createdBy: userId,
          requirements: {
            create: requirementIds.map((requirementId) => ({ requirementId })),
          },
        },
        include: withRequirements,
      });
      await tx.decisionVersion.create({
        data: {
          decisionId: row.id,
          version: row.version,
          changedBy: userId,
          snapshot: this.snapshot(row),
        },
      });
      return row;
    });
  }

  update(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    data: UpdateDecision,
  ) {
    const { expectedVersion, requirementIds, ...fields } = data;
    return this.database.db.$transaction(async (tx) => {
      const [updated] = await tx.decision.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: 'PROPOSED',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: { ...fields, version: { increment: 1 } },
      });
      if (!updated) return null;
      await tx.decisionRequirement.deleteMany({ where: { decisionId: id } });
      if (requirementIds.length)
        await tx.decisionRequirement.createMany({
          data: requirementIds.map((requirementId) => ({
            projectId,
            decisionId: id,
            requirementId,
          })),
        });
      const row = await tx.decision.findUniqueOrThrow({
        where: { id },
        include: withRequirements,
      });
      await tx.decisionVersion.create({
        data: {
          decisionId: id,
          version: row.version,
          changedBy: userId,
          snapshot: this.snapshot(row),
        },
      });
      return row;
    });
  }

  approve(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    expectedVersion: number,
  ) {
    return this.database.db.$transaction(async (tx) => {
      const [updated] = await tx.decision.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: 'PROPOSED',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: {
          status: 'APPROVED',
          decidedBy: userId,
          decisionDate: new Date(),
          version: { increment: 1 },
        },
      });
      if (!updated) return null;
      const row = await tx.decision.findUniqueOrThrow({
        where: { id },
        include: withRequirements,
      });
      await tx.decisionVersion.create({
        data: {
          decisionId: id,
          version: row.version,
          changedBy: userId,
          snapshot: this.snapshot(row),
        },
      });
      return row;
    });
  }

  supersede(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    expectedVersion: number,
    replacementDecisionId: string,
  ) {
    return this.database.db.$transaction(async (tx) => {
      const replacement = await tx.decision.findFirst({
        where: {
          id: replacementDecisionId,
          workspaceId,
          projectId,
          status: 'APPROVED',
          project: { members: { some: { userId } } },
        },
      });
      if (!replacement || replacement.id === id) return null;
      const [updated] = await tx.decision.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: 'APPROVED',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: {
          status: 'SUPERSEDED',
          supersededById: replacement.id,
          version: { increment: 1 },
        },
      });
      if (!updated) return null;
      const row = await tx.decision.findUniqueOrThrow({
        where: { id },
        include: withRequirements,
      });
      await tx.decisionVersion.create({
        data: {
          decisionId: id,
          version: row.version,
          changedBy: userId,
          snapshot: this.snapshot(row),
        },
      });
      return row;
    });
  }
}
