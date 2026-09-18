import { Inject, Injectable } from '@nestjs/common';
import {
  requirementDtoSchema,
  type SourceAnalysisResult,
  type UpdateSourceProposal,
} from '@ba/contracts';
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

  updateProposal(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    expectedVersion: number,
    result: SourceAnalysisResult,
  ) {
    return this.database.db.sourceAnalysis.updateManyAndReturn({
      where: {
        id,
        workspaceId,
        projectId,
        status: 'COMPLETED',
        reviewStatus: 'PENDING',
        version: expectedVersion,
        project: { members: { some: { userId } } },
      },
      data: { result, version: { increment: 1 } },
    });
  }

  reject(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    expectedVersion: number,
  ) {
    return this.database.db.sourceAnalysis.updateManyAndReturn({
      where: {
        id,
        workspaceId,
        projectId,
        status: 'COMPLETED',
        reviewStatus: 'PENDING',
        version: expectedVersion,
        project: { members: { some: { userId } } },
      },
      data: {
        reviewStatus: 'REJECTED',
        reviewedBy: userId,
        reviewedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }

  accept(
    userId: string,
    workspaceId: string,
    projectId: string,
    id: string,
    expectedVersion: number,
    result: SourceAnalysisResult,
    fields: Omit<UpdateSourceProposal, 'expectedVersion'>,
  ) {
    return this.database.db.$transaction(async (tx) => {
      const [analysis] = await tx.sourceAnalysis.updateManyAndReturn({
        where: {
          id,
          workspaceId,
          projectId,
          status: 'COMPLETED',
          reviewStatus: 'PENDING',
          version: expectedVersion,
          project: { members: { some: { userId } } },
        },
        data: {
          reviewStatus: 'ACCEPTED',
          reviewedBy: userId,
          reviewedAt: new Date(),
          version: { increment: 1 },
        },
      });
      if (!analysis) return null;
      const requirement = await tx.requirement.create({
        data: { ...fields, workspaceId, projectId, createdBy: userId },
      });
      const snapshot = requirementDtoSchema.parse({
        ...requirement,
        approvedAt: null,
        baselinedAt: null,
        createdAt: requirement.createdAt.toISOString(),
        updatedAt: requirement.updatedAt.toISOString(),
      });
      await tx.requirementVersion.create({
        data: {
          requirementId: requirement.id,
          version: requirement.version,
          changedBy: userId,
          snapshot,
        },
      });
      const evidenceSegmentIds = [
        ...new Set(result.requirement.evidenceSegmentIds),
      ];
      if (evidenceSegmentIds.length)
        await tx.requirementEvidence.createMany({
          data: evidenceSegmentIds.map((segmentId) => ({
            projectId,
            requirementId: requirement.id,
            requirementVersion: requirement.version,
            segmentId,
            createdBy: userId,
          })),
        });
      return tx.sourceAnalysis.update({
        where: { id },
        data: { acceptedRequirementId: requirement.id },
      });
    });
  }
}
