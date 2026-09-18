import { Inject, Injectable } from '@nestjs/common';
import { traceabilityItemSchema, type TraceabilityItem } from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { TraceabilityRepository } from './traceability.repository.js';

@Injectable()
export class TraceabilityService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(TraceabilityRepository) private readonly repository: TraceabilityRepository,
  ) {}
  async list(user: string, workspace: string, project: string): Promise<TraceabilityItem[]> {
    await this.projects.getProject(user, workspace, project);
    const [rows, openRows] = await Promise.all([
      this.repository.list(workspace, project),
      this.repository.openQuestionCounts(project),
    ]);
    const open = new Map(openRows.map((row) => [row.requirementId, row._count._all]));
    return rows.map((row) => traceabilityItemSchema.parse({
      requirementId: row.id,
      title: row.title,
      status: row.status,
      version: row.version,
      evidenceCount: row.evidence.length,
      sourceCount: new Set(row.evidence.map((item) => item.segment.sourceId)).size,
      questionCount: row._count.questions,
      openQuestionCount: open.get(row.id) ?? 0,
      businessRuleCount: row._count.businessRuleLinks,
      decisionCount: row._count.decisionLinks,
    }));
  }
}
