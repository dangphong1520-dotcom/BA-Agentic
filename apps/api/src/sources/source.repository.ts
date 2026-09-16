import { Inject, Injectable } from '@nestjs/common';
import type { CreateSource } from '@ba/contracts';
import { DatabaseService } from '../database/database.service.js';
@Injectable()
export class SourceRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}
  list(workspaceId: string, projectId: string) {
    return this.database.db.source.findMany({
      where: { workspaceId, projectId },
      include: { segments: { orderBy: { line: 'asc' } } },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
    });
  }
  get(workspaceId: string, projectId: string, id: string) {
    return this.database.db.source.findFirst({
      where: { id, workspaceId, projectId },
      include: { segments: { orderBy: { line: 'asc' } } },
    });
  }
  create(
    userId: string,
    workspaceId: string,
    projectId: string,
    data: CreateSource,
  ) {
    let offset = 0;
    const segments = data.content.split('\n').flatMap((text, index) => {
      const startOffset = offset;
      offset += text.length + 1;
      return text.trim()
        ? [
            {
              line: index + 1,
              startOffset,
              endOffset: startOffset + text.length,
              text,
            },
          ]
        : [];
    });
    return this.database.db.source.create({
      data: {
        ...data,
        workspaceId,
        projectId,
        createdBy: userId,
        segments: { create: segments },
      },
      include: { segments: { orderBy: { line: 'asc' } } },
    });
  }
  requirement(workspaceId: string, projectId: string, id: string) {
    return this.database.db.requirement.findFirst({
      where: { id, workspaceId, projectId },
    });
  }
  segment(projectId: string, id: string) {
    return this.database.db.sourceSegment.findFirst({
      where: { id, projectId },
    });
  }
  evidence(projectId: string, requirementId: string) {
    return this.database.db.requirementEvidence.findMany({
      where: { projectId, requirementId },
      include: { segment: { include: { source: true } } },
      orderBy: [{ requirementVersion: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }
  link(
    userId: string,
    projectId: string,
    requirementId: string,
    version: number,
    segmentId: string,
  ) {
    return this.database.db.$transaction(async (tx) => {
      const current = await tx.requirement.findFirst({
        where: { id: requirementId, projectId, version },
      });
      if (!current) return null;
      // Lock the current draft row without changing its content or version.
      // Concurrent content edits must finish before checking the version.
      const locked = await tx.requirement.updateMany({
        where: {
          id: requirementId,
          projectId,
          version,
          status: 'DRAFT',
          project: { members: { some: { userId } } },
        },
        data: { version, updatedAt: current.updatedAt },
      });
      if (!locked.count) return null;
      return tx.requirementEvidence.upsert({
        where: {
          requirementId_requirementVersion_segmentId: {
            requirementId,
            requirementVersion: version,
            segmentId,
          },
        },
        create: {
          projectId,
          requirementId,
          requirementVersion: version,
          segmentId,
          createdBy: userId,
        },
        update: {},
        include: { segment: { include: { source: true } } },
      });
    });
  }
}
