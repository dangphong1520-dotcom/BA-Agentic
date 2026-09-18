import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  sourceAnalysisDtoSchema,
  sourceAnalysisResultSchema,
  type SourceAnalysisDto,
  type SourceAnalysisResult,
  type UpdateSourceProposal,
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
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
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

  private async reviewable(
    user: string,
    workspace: string,
    project: string,
    id: string,
  ) {
    const row = await this.repository.get(user, workspace, project, id);
    if (!row) throw new NotFoundException('Source analysis not found');
    if (row.status !== 'COMPLETED' || !row.result)
      throw new ConflictException('Analysis is not ready for review');
    const source = await this.sources.get(
      user,
      workspace,
      project,
      row.sourceId,
    );
    const result = this.validate(
      sourceAnalysisResultSchema.parse(row.result),
      new Set(source.segments.map((segment) => segment.id)),
    );
    return { row, result };
  }

  async updateProposal(
    user: string,
    workspace: string,
    project: string,
    id: string,
    data: UpdateSourceProposal,
  ) {
    const { row, result } = await this.reviewable(
      user,
      workspace,
      project,
      id,
    );
    const { expectedVersion, ...fields } = data;
    const [updated] = await this.repository.updateProposal(
      user,
      workspace,
      project,
      row.id,
      expectedVersion,
      { ...result, requirement: { ...result.requirement, ...fields } },
    );
    if (!updated)
      throw new ConflictException('Proposal was already changed or reviewed');
    return this.dto(updated);
  }

  async reject(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    await this.reviewable(user, workspace, project, id);
    const [updated] = await this.repository.reject(
      user,
      workspace,
      project,
      id,
      expectedVersion,
    );
    if (!updated)
      throw new ConflictException('Proposal was already changed or reviewed');
    return this.dto(updated);
  }

  async accept(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    const { result } = await this.reviewable(
      user,
      workspace,
      project,
      id,
    );
    const {
      classification: _classification,
      evidenceSegmentIds: _evidence,
      confidence: _confidence,
      ...fields
    } = result.requirement;
    const updated = await this.repository.accept(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      result,
      fields,
    );
    if (!updated)
      throw new ConflictException('Proposal was already changed or reviewed');
    return this.dto(updated);
  }
}
