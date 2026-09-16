import { Inject, Injectable } from '@nestjs/common';
import {
  questionDtoSchema,
  type CreateQuestion,
  type UpdateQuestion,
} from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class QuestionRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  list(workspaceId: string, projectId: string) {
    return this.database.db.question.findMany({
      where: { workspaceId, projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }

  get(workspaceId: string, projectId: string, id: string) {
    return this.database.db.question.findFirst({
      where: { id, workspaceId, projectId },
    });
  }

  history(id: string) {
    return this.database.db.questionVersion.findMany({
      where: { questionId: id },
      orderBy: { version: 'desc' },
      take: 100,
    });
  }

  create(
    userId: string,
    workspaceId: string,
    projectId: string,
    data: CreateQuestion,
  ) {
    return this.database.db.$transaction(async (tx) => {
      const row = await tx.question.create({
        data: { ...data, workspaceId, projectId, createdBy: userId },
      });
      const snapshot = questionDtoSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
      await tx.questionVersion.create({
        data: {
          questionId: row.id,
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
    data: UpdateQuestion,
  ) {
    const { expectedVersion, ...fields } = data;
    return this.database.db.$transaction(async (tx) => {
      const [row] = await tx.question.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: { not: 'CLOSED' },
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: { ...fields, version: { increment: 1 } },
      });
      if (!row) return null;
      const snapshot = questionDtoSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
      await tx.questionVersion.create({
        data: {
          questionId: id,
          version: row.version,
          changedBy: userId,
          snapshot,
        },
      });
      return row;
    });
  }
}
