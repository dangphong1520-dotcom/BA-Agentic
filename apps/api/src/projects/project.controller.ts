import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  createProjectSchema,
  createWorkspaceSchema,
  entityIdSchema,
  updateProjectSchema,
} from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { ProjectService } from './project.service.js';

function parse<T>(
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false };
  },
  value: unknown,
): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new BadRequestException('Invalid request fields');
  return result.data;
}

@Controller('workspaces')
@UseGuards(DevelopmentAuthGuard)
export class ProjectController {
  constructor(
    @Inject(ProjectService) private readonly service: ProjectService,
  ) {}

  @Post()
  createWorkspace(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Body() body: unknown,
  ) {
    return this.service.createWorkspace(
      response.locals.userId,
      parse(createWorkspaceSchema, body),
    );
  }

  @Get()
  listWorkspaces(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
  ) {
    return this.service.listWorkspaces(response.locals.userId);
  }

  @Post(':workspaceId/projects')
  createProject(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param('workspaceId') workspaceId: string,
    @Body() body: unknown,
  ) {
    return this.service.createProject(
      response.locals.userId,
      parse(entityIdSchema, workspaceId),
      parse(createProjectSchema, body),
    );
  }

  @Get(':workspaceId/projects')
  listProjects(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.service.listProjects(
      response.locals.userId,
      parse(entityIdSchema, workspaceId),
    );
  }

  @Get(':workspaceId/projects/:projectId')
  getProject(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.service.getProject(
      response.locals.userId,
      parse(entityIdSchema, workspaceId),
      parse(entityIdSchema, projectId),
    );
  }

  @Patch(':workspaceId/projects/:projectId')
  updateProject(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ) {
    return this.service.updateProject(
      response.locals.userId,
      parse(entityIdSchema, workspaceId),
      parse(entityIdSchema, projectId),
      parse(updateProjectSchema, body),
    );
  }
}
