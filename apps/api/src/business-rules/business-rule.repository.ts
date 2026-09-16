import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import {
  businessRuleDtoSchema,
  type CreateBusinessRule,
  type UpdateBusinessRule,
} from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';
import type { Prisma } from '../generated/prisma/client.js';

const withRequirements = {
  requirements: { select: { requirementId: true } },
} as const;
type BusinessRuleRow = Prisma.BusinessRuleGetPayload<{
  include: typeof withRequirements;
}>;

@Injectable()
export class BusinessRuleRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  list(workspaceId: string, projectId: string) {
    return this.database.db.businessRule.findMany({
      where: { workspaceId, projectId },
      include: withRequirements,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }

  get(workspaceId: string, projectId: string, id: string) {
    return this.database.db.businessRule.findFirst({
      where: { id, workspaceId, projectId },
      include: withRequirements,
    });
  }

  history(id: string) {
    return this.database.db.businessRuleVersion.findMany({
      where: { businessRuleId: id },
      orderBy: { version: 'desc' },
      take: 100,
    });
  }

  private snapshot(row: BusinessRuleRow) {
    const { requirements, ...fields } = row;
    return businessRuleDtoSchema.parse({
      ...fields,
      requirementIds: requirements.map((item) => item.requirementId),
      approvedAt: row.approvedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  create(
    userId: string,
    workspaceId: string,
    projectId: string,
    data: CreateBusinessRule,
  ) {
    const id = randomUUID();
    const code = `BR-${id.replaceAll('-', '').slice(0, 8).toUpperCase()}`;
    const { requirementIds, ...fields } = data;
    return this.database.db.$transaction(async (tx) => {
      const row = await tx.businessRule.create({
        data: {
          id,
          code,
          ...fields,
          workspaceId,
          projectId,
          createdBy: userId,
          requirements: {
            create: requirementIds.map((requirementId) => ({
              requirementId,
            })),
          },
        },
        include: withRequirements,
      });
      await tx.businessRuleVersion.create({
        data: {
          businessRuleId: row.id,
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
    data: UpdateBusinessRule,
  ) {
    const { expectedVersion, requirementIds, ...fields } = data;
    return this.database.db.$transaction(async (tx) => {
      const [updated] = await tx.businessRule.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: 'DRAFT',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: { ...fields, version: { increment: 1 } },
      });
      if (!updated) return null;
      await tx.businessRuleRequirement.deleteMany({
        where: { businessRuleId: id },
      });
      if (requirementIds.length)
        await tx.businessRuleRequirement.createMany({
          data: requirementIds.map((requirementId) => ({
            projectId,
            businessRuleId: id,
            requirementId,
          })),
        });
      const row = await tx.businessRule.findUniqueOrThrow({
        where: { id },
        include: withRequirements,
      });
      await tx.businessRuleVersion.create({
        data: {
          businessRuleId: id,
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
      const [updated] = await tx.businessRule.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: 'DRAFT',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: {
          status: 'APPROVED',
          approvedBy: userId,
          approvedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (!updated) return null;
      const row = await tx.businessRule.findUniqueOrThrow({
        where: { id },
        include: withRequirements,
      });
      await tx.businessRuleVersion.create({
        data: {
          businessRuleId: id,
          version: row.version,
          changedBy: userId,
          snapshot: this.snapshot(row),
        },
      });
      return row;
    });
  }
}
