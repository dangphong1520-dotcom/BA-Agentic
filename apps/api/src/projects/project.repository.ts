import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import type {
  CreateProject,
  CreateWorkspace,
  UpdateProject,
} from '@ba/contracts';

@Injectable()
export class ProjectRepository {
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  userExists(userId: string) {
    return this.database.db.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  }

  createWorkspace(userId: string, data: CreateWorkspace) {
    return this.database.db.workspace.create({
      data: { name: data.name, members: { create: { userId } } },
    });
  }

  listWorkspaces(userId: string) {
    return this.database.db.workspace.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  membership(userId: string, workspaceId: string) {
    return this.database.db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  }

  createProject(userId: string, workspaceId: string, data: CreateProject) {
    return this.database.db.project.create({
      data: { ...data, workspaceId, members: { create: { userId } } },
    });
  }

  listProjects(userId: string, workspaceId: string) {
    return this.database.db.project.findMany({
      where: { workspaceId, members: { some: { userId } } },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  getProject(userId: string, workspaceId: string, id: string) {
    return this.database.db.project.findFirst({
      where: { id, workspaceId, members: { some: { userId } } },
    });
  }

  updateProject(
    userId: string,
    workspaceId: string,
    id: string,
    data: UpdateProject,
  ) {
    const { expectedVersion, ...fields } = data;
    return this.database.db.project.updateManyAndReturn({
      where: {
        id,
        workspaceId,
        version: expectedVersion,
        members: { some: { userId } },
      },
      data: { ...fields, version: { increment: 1 } },
    });
  }
}
