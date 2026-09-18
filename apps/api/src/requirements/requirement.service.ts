import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  requirementDtoSchema,
  requirementVersionSchema,
  type CreateRequirement,
  type UpdateRequirement,
} from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { RequirementRepository } from './requirement.repository.js';

@Injectable()
export class RequirementService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(RequirementRepository)
    private readonly repository: RequirementRepository,
  ) {}
  private dto(
    row: NonNullable<Awaited<ReturnType<RequirementRepository['get']>>>,
  ) {
    return requirementDtoSchema.parse({
      ...row,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      baselinedAt: row.baselinedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
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
    if (!row) throw new NotFoundException('Requirement not found');
    return this.dto(row);
  }
  async history(user: string, workspace: string, project: string, id: string) {
    await this.get(user, workspace, project, id);
    return (await this.repository.history(id)).map((row) =>
      requirementVersionSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }
  async create(
    user: string,
    workspace: string,
    project: string,
    data: CreateRequirement,
  ) {
    await this.projects.getProject(user, workspace, project);
    return this.dto(
      await this.repository.create(user, workspace, project, data),
    );
  }
  async update(
    user: string,
    workspace: string,
    project: string,
    id: string,
    data: UpdateRequirement,
  ) {
    const current = await this.get(user, workspace, project, id);
    if (!['DRAFT', 'CLARIFICATION_REQUIRED'].includes(current.status))
      throw new ConflictException('Requirement is no longer editable');
    const row = await this.repository.update(
      user,
      workspace,
      project,
      id,
      data,
    );
    if (!row)
      throw new ConflictException(
        'Requirement changed or is no longer editable',
      );
    return this.dto(row);
  }

  private async transition(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
    from: Array<
      'DRAFT' | 'CLARIFICATION_REQUIRED' | 'READY_FOR_REVIEW' | 'APPROVED'
    >,
    to:
      'CLARIFICATION_REQUIRED' | 'READY_FOR_REVIEW' | 'APPROVED' | 'BASELINED',
    governance: {
      approvedBy?: string;
      approvedAt?: Date;
      baselinedBy?: string;
      baselinedAt?: Date;
    } = {},
  ) {
    const current = await this.get(user, workspace, project, id);
    if (
      current.version !== expectedVersion ||
      !from.includes(current.status as (typeof from)[number])
    )
      throw new ConflictException(
        'Requirement changed or transition is invalid',
      );
    if (
      to === 'READY_FOR_REVIEW' &&
      (!current.description.trim() || !current.acceptanceCriteria.trim())
    )
      throw new ConflictException(
        'Description and acceptance criteria are required for review',
      );
    if (
      to === 'READY_FOR_REVIEW' &&
      (await this.repository.hasUnresolvedBlockingQuestions(
        workspace,
        project,
        id,
      ))
    )
      throw new UnprocessableEntityException(
        'Close blocking questions before review',
      );
    const row = await this.repository.transition(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      from,
      to,
      governance,
    );
    if (!row)
      throw new ConflictException(
        'Requirement changed or transition is invalid',
      );
    return this.dto(row);
  }

  requestClarification(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    return this.transition(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      ['DRAFT', 'READY_FOR_REVIEW'],
      'CLARIFICATION_REQUIRED',
    );
  }

  readyForReview(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    return this.transition(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      ['DRAFT', 'CLARIFICATION_REQUIRED'],
      'READY_FOR_REVIEW',
    );
  }

  approve(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    return this.transition(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      ['READY_FOR_REVIEW'],
      'APPROVED',
      { approvedBy: user, approvedAt: new Date() },
    );
  }

  baseline(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    return this.transition(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      ['APPROVED'],
      'BASELINED',
      { baselinedBy: user, baselinedAt: new Date() },
    );
  }
}
