import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  businessRuleDtoSchema,
  businessRuleVersionSchema,
  createBusinessRuleSchema,
  updateBusinessRuleSchema,
  type CreateBusinessRule,
  type UpdateBusinessRule,
} from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { RequirementService } from '../requirements/requirement.service.js';
import { BusinessRuleRepository } from './business-rule.repository.js';

@Injectable()
export class BusinessRuleService {
  constructor(
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(RequirementService)
    private readonly requirements: RequirementService,
    @Inject(BusinessRuleRepository)
    private readonly repository: BusinessRuleRepository,
  ) {}

  private dto(
    row: NonNullable<Awaited<ReturnType<BusinessRuleRepository['get']>>>,
  ) {
    const { requirements, ...fields } = row;
    return businessRuleDtoSchema.parse({
      ...fields,
      requirementIds: requirements.map((item) => item.requirementId),
      approvedAt: row.approvedAt?.toISOString() ?? null,
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
    if (!row) throw new NotFoundException('Business rule not found');
    return this.dto(row);
  }

  async history(user: string, workspace: string, project: string, id: string) {
    await this.get(user, workspace, project, id);
    return (await this.repository.history(id)).map((row) =>
      businessRuleVersionSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  async create(
    user: string,
    workspace: string,
    project: string,
    data: CreateBusinessRule,
  ) {
    await this.projects.getProject(user, workspace, project);
    const parsed = createBusinessRuleSchema.safeParse(data);
    if (!parsed.success) throw new BadRequestException('Invalid business rule');
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
    data: UpdateBusinessRule,
  ) {
    const current = await this.get(user, workspace, project, id);
    const parsed = updateBusinessRuleSchema.safeParse(data);
    if (!parsed.success) throw new BadRequestException('Invalid business rule');
    if (
      current.status !== 'DRAFT' ||
      current.version !== parsed.data.expectedVersion
    )
      throw new ConflictException('Business rule changed or is approved');
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
      throw new ConflictException('Business rule changed or is approved');
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
      throw new ConflictException('Business rule changed or is approved');
    return this.dto(row);
  }
}
