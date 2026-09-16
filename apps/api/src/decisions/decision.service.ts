import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createDecisionSchema,
  decisionDtoSchema,
  decisionVersionSchema,
  updateDecisionSchema,
  type CreateDecision,
  type UpdateDecision,
} from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { RequirementService } from '../requirements/requirement.service.js';
import { DecisionRepository } from './decision.repository.js';

@Injectable()
export class DecisionService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(RequirementService)
    private readonly requirements: RequirementService,
    @Inject(DecisionRepository)
    private readonly repository: DecisionRepository,
  ) {}

  private dto(
    row: NonNullable<Awaited<ReturnType<DecisionRepository['get']>>>,
  ) {
    const { requirements, ...fields } = row;
    return decisionDtoSchema.parse({
      ...fields,
      requirementIds: requirements.map((item) => item.requirementId),
      decisionDate: row.decisionDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  private async validateRequirements(
    user: string,
    workspace: string,
    project: string,
    requirementIds: string[],
  ) {
    await Promise.all(
      requirementIds.map((id) =>
        this.requirements.get(user, workspace, project, id),
      ),
    );
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
    if (!row) throw new NotFoundException('Decision not found');
    return this.dto(row);
  }

  async history(user: string, workspace: string, project: string, id: string) {
    await this.get(user, workspace, project, id);
    return (await this.repository.history(id)).map((row) =>
      decisionVersionSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  async create(
    user: string,
    workspace: string,
    project: string,
    data: CreateDecision,
  ) {
    await this.projects.getProject(user, workspace, project);
    const parsed = createDecisionSchema.safeParse(data);
    if (!parsed.success) throw new BadRequestException('Invalid decision');
    await this.validateRequirements(
      user,
      workspace,
      project,
      parsed.data.requirementIds,
    );
    return this.dto(
      await this.repository.create(user, workspace, project, parsed.data),
    );
  }

  async update(
    user: string,
    workspace: string,
    project: string,
    id: string,
    data: UpdateDecision,
  ) {
    const current = await this.get(user, workspace, project, id);
    const parsed = updateDecisionSchema.safeParse(data);
    if (!parsed.success) throw new BadRequestException('Invalid decision');
    if (
      current.status !== 'PROPOSED' ||
      current.version !== parsed.data.expectedVersion
    )
      throw new ConflictException('Decision changed or is no longer proposed');
    await this.validateRequirements(
      user,
      workspace,
      project,
      parsed.data.requirementIds,
    );
    const row = await this.repository.update(
      user,
      workspace,
      project,
      id,
      parsed.data,
    );
    if (!row)
      throw new ConflictException('Decision changed or is no longer proposed');
    return this.dto(row);
  }

  async approve(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
  ) {
    await this.get(user, workspace, project, id);
    const row = await this.repository.approve(
      user,
      workspace,
      project,
      id,
      expectedVersion,
    );
    if (!row)
      throw new ConflictException('Decision changed or is no longer proposed');
    return this.dto(row);
  }

  async supersede(
    user: string,
    workspace: string,
    project: string,
    id: string,
    expectedVersion: number,
    replacementDecisionId: string,
  ) {
    await this.get(user, workspace, project, id);
    const row = await this.repository.supersede(
      user,
      workspace,
      project,
      id,
      expectedVersion,
      replacementDecisionId,
    );
    if (!row)
      throw new ConflictException(
        'Decision changed or replacement is not an approved project decision',
      );
    return this.dto(row);
  }
}
