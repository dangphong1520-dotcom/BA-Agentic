import { Inject, Injectable } from '@nestjs/common';
import type { SourceAnalysisResult } from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class SourceAnalysisRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  create(
    userId: string,
    workspaceId: string,
    projectId: string,
    sourceId: string,
    sourceRevision: number,
    modelProfile: string,
  ) {
    return this.database.db.sourceAnalysis.create({
      data: {
        requestedBy: userId,
        workspaceId,
        projectId,
        sourceId,
        sourceRevision,
        modelProfile,
      },
    });
  }
  complete(id: string, result: SourceAnalysisResult) {
    return this.database.db.sourceAnalysis.update({
      where: { id },
      data: { status: 'COMPLETED', result, completedAt: new Date() },
    });
  }
  fail(id: string, errorCode: string, errorMessage: string) {
    return this.database.db.sourceAnalysis.update({
      where: { id },
      data: {
        status: 'FAILED',
        errorCode,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }
  list(
    userId: string,
    workspaceId: string,
    projectId: string,
    sourceId: string,
  ) {
    return this.database.db.sourceAnalysis.findMany({
      where: {
        workspaceId,
        projectId,
        sourceId,
        project: { members: { some: { userId } } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
    });
  }
  get(userId: string, workspaceId: string, projectId: string, id: string) {
    return this.database.db.sourceAnalysis.findFirst({
      where: {
        id,
        workspaceId,
        projectId,
        project: { members: { some: { userId } } },
      },
    });
  }
}
