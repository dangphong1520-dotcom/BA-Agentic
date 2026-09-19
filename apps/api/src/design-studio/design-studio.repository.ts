import { Inject, Injectable } from '@nestjs/common';
import type { DesignContent } from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class DesignStudioRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  list(userId: string, workspaceId: string, projectId: string, requirementId: string) {
    return this.database.db.designArtifact.findMany({ where: { workspaceId, projectId, requirementId, project: { members: { some: { userId } } } }, orderBy: { artifactVersion: 'desc' }, take: 50 });
  }
  get(userId: string, workspaceId: string, projectId: string, id: string) {
    return this.database.db.designArtifact.findFirst({ where: { id, workspaceId, projectId, project: { members: { some: { userId } } } } });
  }
  async create(userId: string, workspaceId: string, projectId: string, requirementId: string, requirementVersion: number, trigger: 'MANUAL' | 'REQUIREMENT_CHANGED', generatorProfile: string, result: DesignContent, instruction = '') {
    return this.database.db.$transaction(async (tx) => {
      if (trigger === 'REQUIREMENT_CHANGED') {
        const existing = await tx.designArtifact.findFirst({ where: { requirementId, requirementVersion, generatorProfile, trigger } });
        if (existing) return existing;
      }
      await tx.designArtifact.updateMany({ where: { requirementId, status: 'PENDING_REVIEW', requirementVersion: { lt: requirementVersion } }, data: { status: 'STALE', revision: { increment: 1 } } });
      const latest = await tx.designArtifact.aggregate({ where: { requirementId }, _max: { artifactVersion: true } });
      return tx.designArtifact.create({ data: { workspaceId, projectId, requirementId, requirementVersion, artifactVersion: (latest._max.artifactVersion ?? 0) + 1, trigger, generatorProfile, result, instruction, createdBy: userId } });
    });
  }
  review(userId: string, workspaceId: string, projectId: string, requirementId: string, id: string, expectedRevision: number, status: 'ACCEPTED' | 'REJECTED') {
    return this.database.db.designArtifact.updateManyAndReturn({ where: { id, workspaceId, projectId, requirementId, revision: expectedRevision, status: 'PENDING_REVIEW', project: { members: { some: { userId } } } }, data: { status, revision: { increment: 1 }, reviewedBy: userId, reviewedAt: new Date() } });
  }
  outdated() {
    return this.database.db.requirement.findMany({ where: { designArtifacts: { some: {} } }, include: { designArtifacts: { orderBy: { artifactVersion: 'desc' }, take: 1 } }, take: 100 });
  }
}
