import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
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
    await this.get(user, workspace, project, id);
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
}
