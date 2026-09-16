import { Inject, Injectable } from '@nestjs/common';
import {
  requirementDtoSchema,
  type CreateRequirement,
  type RequirementDto,
  type UpdateRequirement,
} from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class RequirementRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  list(workspaceId: string, projectId: string) {
    return this.database.db.requirement.findMany({
      where: { workspaceId, projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
    });
  }

  get(workspaceId: string, projectId: string, id: string) {
    return this.database.db.requirement.findFirst({
      where: { id, workspaceId, projectId },
    });
  }

  history(id: string) {
    return this.database.db.requirementVersion.findMany({
      where: { requirementId: id },
      orderBy: { version: 'desc' },
      take: 100,
    });
  }

  private snapshot(
    row: NonNullable<Awaited<ReturnType<RequirementRepository['get']>>>,
  ) {
    return requirementDtoSchema.parse({
      ...row,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      baselinedAt: row.baselinedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  create(
    userId: string,
    workspaceId: string,
    projectId: string,
    data: CreateRequirement,
  ) {
    return this.database.db.$transaction(async (tx) => {
      const row = await tx.requirement.create({
        data: { ...data, workspaceId, projectId, createdBy: userId },
      });
      const snapshot = this.snapshot(row);
      await tx.requirementVersion.create({
        data: {
          requirementId: row.id,
          version: row.version,
          changedBy: userId,
          snapshot,
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
    data: UpdateRequirement,
  ) {
    const { expectedVersion, ...fields } = data;
    return this.database.db.$transaction(async (tx) => {
      const [row] = await tx.requirement.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: { in: ['DRAFT', 'CLARIFICATION_REQUIRED'] },
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: { ...fields, version: { increment: 1 } },
      });
      if (!row) return null;
      const snapshot = this.snapshot(row);
      await tx.requirementVersion.create({
        data: {
          requirementId: id,
          version: row.version,
          changedBy: userId,
          snapshot,
        },
      });
      return row;
    });
  }

  transition(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    expectedVersion: number,
    from: RequirementDto['status'][],
    to: RequirementDto['status'],
    governance: {
      approvedBy?: string;
      approvedAt?: Date;
      baselinedBy?: string;
      baselinedAt?: Date;
    } = {},
  ) {
    return this.database.db.$transaction(async (tx) => {
      const [row] = await tx.requirement.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: { in: from },
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: {
          status: to,
          ...governance,
          version: { increment: 1 },
        },
      });
      if (!row) return null;
      await tx.requirementVersion.create({
        data: {
          requirementId: id,
          version: row.version,
          changedBy: userId,
          snapshot: this.snapshot(row),
        },
      });
      return row;
    });
  }
}
