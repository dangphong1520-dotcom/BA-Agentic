import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  sourceAnalysisDtoSchema,
  sourceAnalysisResultSchema,
  type SourceAnalysisDto,
  type SourceAnalysisResult,
} from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { SourceService } from '../sources/source.service.js';
import { SourceAnalysisGateway } from './source-analysis.gateway.js';
import { SourceAnalysisRepository } from './source-analysis.repository.js';

@Injectable()
export class SourceAnalysisService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(SourceService) private readonly sources: SourceService,
    @Inject(SourceAnalysisGateway)
    private readonly gateway: SourceAnalysisGateway,
    @Inject(SourceAnalysisRepository)
    private readonly repository: SourceAnalysisRepository,
  ) {}

  private dto(
    row: NonNullable<Awaited<ReturnType<SourceAnalysisRepository['get']>>>,
  ): SourceAnalysisDto {
    return sourceAnalysisDtoSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      completedAt: row.completedAt?.toISOString() ?? null,
    });
  }
  private validate(result: SourceAnalysisResult, segmentIds: Set<string>) {
    const parsed = sourceAnalysisResultSchema.parse(result);
    const statements = [parsed.requirement, ...parsed.findings];
    for (const statement of statements) {
      if (
        statement.classification === 'FACT' &&
        !statement.evidenceSegmentIds.length
      )
        throw new Error('FACT_WITHOUT_EVIDENCE');
      if (statement.evidenceSegmentIds.some((id) => !segmentIds.has(id)))
        throw new Error('INVALID_EVIDENCE_REFERENCE');
    }
    for (const question of parsed.questions)
      if (question.evidenceSegmentIds.some((id) => !segmentIds.has(id)))
        throw new Error('INVALID_EVIDENCE_REFERENCE');
    return parsed;
  }
  async create(
    user: string,
    workspace: string,
    project: string,
    sourceId: string,
  ) {
    const [currentProject, source] = await Promise.all([
      this.projects.getProject(user, workspace, project),
      this.sources.get(user, workspace, project, sourceId),
    ]);
    if (!source.content.trim() || !source.segments.length)
      throw new BadRequestException('Source is empty');
    const run = await this.repository.create(
      user,
      workspace,
      project,
      sourceId,
      source.revision,
      this.gateway.modelProfile,
    );
    try {
      const result = this.validate(
        this.gateway.analyze(source, currentProject),
        new Set(source.segments.map((row) => row.id)),
      );
      return this.dto(await this.repository.complete(run.id, result));
    } catch {
      return this.dto(
        await this.repository.fail(
          run.id,
          'ANALYSIS_VALIDATION_FAILED',
          'Kết quả phân tích không hợp lệ. Hãy chạy lại.',
        ),
      );
    }
  }
  async list(
    user: string,
    workspace: string,
    project: string,
    sourceId: string,
  ) {
    await this.sources.get(user, workspace, project, sourceId);
    return (await this.repository.list(user, workspace, project, sourceId)).map(
      (row) => this.dto(row),
    );
  }
  async get(user: string, workspace: string, project: string, id: string) {
    await this.projects.getProject(user, workspace, project);
    const row = await this.repository.get(user, workspace, project, id);
    if (!row) throw new NotFoundException('Source analysis not found');
    return this.dto(row);
  }
}
