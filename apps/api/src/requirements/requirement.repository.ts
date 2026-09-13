import { Inject, Injectable } from '@nestjs/common';
import {
  requirementDtoSchema,
  type CreateRequirement,
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
      const snapshot = requirementDtoSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
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
          status: 'DRAFT',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: { ...fields, version: { increment: 1 } },
      });
      if (!row) return null;
      const snapshot = requirementDtoSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
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
}
