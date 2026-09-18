import { Inject, Injectable } from '@nestjs/common';
import {
  findingRegisterItemSchema,
  sourceAnalysisResultSchema,
  type FindingRegisterItem,
} from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { FindingRepository } from './finding.repository.js';

@Injectable()
export class FindingService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(FindingRepository) private readonly repository: FindingRepository,
  ) {}
  async list(user: string, workspace: string, project: string): Promise<FindingRegisterItem[]> {
    await this.projects.getProject(user, workspace, project);
    const rows = await this.repository.list(user, workspace, project);
    return rows.flatMap((row) => {
      const parsed = sourceAnalysisResultSchema.safeParse(row.result);
      if (!parsed.success) return [];
      return parsed.data.findings.map((finding, index) =>
        findingRegisterItemSchema.parse({
          ...finding,
          id: `${row.id}:${index}`,
          analysisId: row.id,
          sourceId: row.sourceId,
          sourceTitle: row.source.title,
          evidenceCount: finding.evidenceSegmentIds.length,
          reviewStatus: row.reviewStatus,
          createdAt: row.createdAt.toISOString(),
        }),
      );
    });
  }
}
