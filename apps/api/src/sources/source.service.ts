import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  sourceDtoSchema,
  evidenceDtoSchema,
  type CreateSource,
  type LinkEvidence,
} from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { SourceRepository } from './source.repository.js';
@Injectable()
export class SourceService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(SourceRepository) private readonly repository: SourceRepository,
  ) {}
  private dto(row: NonNullable<Awaited<ReturnType<SourceRepository['get']>>>) {
    return sourceDtoSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
    });
  }
  private evidenceDto(
    row: NonNullable<Awaited<ReturnType<SourceRepository['link']>>>,
  ) {
    return evidenceDtoSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      sourceTitle: row.segment.source.title,
      sourceRevision: row.segment.source.revision,
    });
  }
  async list(user: string, workspace: string, project: string) {
    await this.projects.getProject(user, workspace, project);
    return (await this.repository.list(workspace, project)).map((row) =>
      this.dto(row),
    );
  }
  async get(user: string, workspace: string, project: string, id: string) {
    await this.projects.getProject(user, workspace, project);
    const row = await this.repository.get(workspace, project, id);
    if (!row) throw new NotFoundException('Source not found');
    return this.dto(row);
  }
  async create(
    user: string,
    workspace: string,
    project: string,
    data: CreateSource,
  ) {
    await this.projects.getProject(user, workspace, project);
    return this.dto(
      await this.repository.create(user, workspace, project, data),
    );
  }
  async evidence(
    user: string,
    workspace: string,
    project: string,
    requirement: string,
  ) {
    await this.projects.getProject(user, workspace, project);
    if (!(await this.repository.requirement(workspace, project, requirement)))
      throw new NotFoundException('Requirement not found');
    return (await this.repository.evidence(project, requirement)).map((row) =>
      this.evidenceDto(row),
    );
  }
  async link(
    user: string,
    workspace: string,
    project: string,
    requirement: string,
    data: LinkEvidence,
  ) {
    await this.projects.getProject(user, workspace, project);
    if (
      !(await this.repository.requirement(workspace, project, requirement)) ||
      !(await this.repository.segment(project, data.segmentId))
    )
      throw new NotFoundException('Requirement or segment not found');
    const row = await this.repository.link(
      user,
      project,
      requirement,
      data.expectedVersion,
      data.segmentId,
    );
    if (!row)
      throw new ConflictException('Requirement changed; reload before linking');
    return this.evidenceDto(row);
  }
}
