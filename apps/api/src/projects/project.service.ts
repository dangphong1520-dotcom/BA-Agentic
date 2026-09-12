import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  CreateProject,
  CreateWorkspace,
  UpdateProject,
  ProjectDto,
  WorkspaceDto,
} from '@ba/contracts';
import { ProjectRepository } from './project.repository.js';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(ProjectRepository) private readonly repository: ProjectRepository,
  ) {}

  private async requireUser(userId: string): Promise<void> {
    if (!(await this.repository.userExists(userId)))
      throw new UnauthorizedException();
  }

  private async requireMembership(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    await this.requireUser(userId);
    if (!(await this.repository.membership(userId, workspaceId)))
      throw new NotFoundException('Workspace not found');
  }

  async createWorkspace(
    userId: string,
    data: CreateWorkspace,
  ): Promise<WorkspaceDto> {
    await this.requireUser(userId);
    const workspace = await this.repository.createWorkspace(userId, data);
    return { ...workspace, createdAt: workspace.createdAt.toISOString() };
  }

  async listWorkspaces(userId: string): Promise<WorkspaceDto[]> {
    await this.requireUser(userId);
    return (await this.repository.listWorkspaces(userId)).map((workspace) => ({
      ...workspace,
      createdAt: workspace.createdAt.toISOString(),
    }));
  }

  async createProject(
    userId: string,
    workspaceId: string,
    data: CreateProject,
  ): Promise<ProjectDto> {
    await this.requireMembership(userId, workspaceId);
    return this.toDto(
      await this.repository.createProject(userId, workspaceId, data),
    );
  }

  async listProjects(
    userId: string,
    workspaceId: string,
  ): Promise<ProjectDto[]> {
    await this.requireMembership(userId, workspaceId);
    return (await this.repository.listProjects(userId, workspaceId)).map(
      (project) => this.toDto(project),
    );
  }

  async getProject(
    userId: string,
    workspaceId: string,
    id: string,
  ): Promise<ProjectDto> {
    await this.requireMembership(userId, workspaceId);
    const project = await this.repository.getProject(userId, workspaceId, id);
    if (!project) throw new NotFoundException('Project not found');
    return this.toDto(project);
  }

  async updateProject(
    userId: string,
    workspaceId: string,
    id: string,
    data: UpdateProject,
  ): Promise<ProjectDto> {
    await this.getProject(userId, workspaceId, id);
    const [project] = await this.repository.updateProject(
      userId,
      workspaceId,
      id,
      data,
    );
    if (!project)
      throw new ConflictException('Project changed; reload before editing');
    return this.toDto(project);
  }

  private toDto(
    project: Awaited<ReturnType<ProjectRepository['createProject']>>,
  ): ProjectDto {
    return {
      ...project,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
