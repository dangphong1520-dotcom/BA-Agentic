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
  approveDecisionSchema,
  createDecisionSchema,
  entityIdSchema,
  supersedeDecisionSchema,
  updateDecisionSchema,
} from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { DecisionService } from './decision.service.js';

function id(value: string) {
  const parsed = entityIdSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException('Invalid identifier');
  return parsed.data;
}

@Controller('workspaces/:workspaceId/projects/:projectId/decisions')
@UseGuards(DevelopmentAuthGuard)
export class DecisionController {
  constructor(
    @Inject(DecisionService) private readonly service: DecisionService,
  ) {}

  @Get()
  list(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
  ) {
    return this.service.list(
      response.locals.userId,
      id(workspace),
      id(project),
    );
  }

  @Post()
  create(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Body() body: unknown,
  ) {
    const parsed = createDecisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid decision');
    return this.service.create(
      response.locals.userId,
      id(workspace),
      id(project),
      parsed.data,
    );
  }

  @Get(':id/versions')
  history(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') decision: string,
  ) {
    return this.service.history(
      response.locals.userId,
      id(workspace),
      id(project),
      id(decision),
    );
  }

  @Get(':id')
  get(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') decision: string,
  ) {
    return this.service.get(
      response.locals.userId,
      id(workspace),
      id(project),
      id(decision),
    );
  }

  @Patch(':id')
  update(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') decision: string,
    @Body() body: unknown,
  ) {
    const parsed = updateDecisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid decision');
    return this.service.update(
      response.locals.userId,
      id(workspace),
      id(project),
      id(decision),
      parsed.data,
    );
  }

  @Post(':id/approve')
  approve(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') decision: string,
    @Body() body: unknown,
  ) {
    const parsed = approveDecisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid approval');
    return this.service.approve(
      response.locals.userId,
      id(workspace),
      id(project),
      id(decision),
      parsed.data.expectedVersion,
    );
  }

  @Post(':id/supersede')
  supersede(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') decision: string,
    @Body() body: unknown,
  ) {
    const parsed = supersedeDecisionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid replacement');
    return this.service.supersede(
      response.locals.userId,
      id(workspace),
      id(project),
      id(decision),
      parsed.data.expectedVersion,
      parsed.data.replacementDecisionId,
    );
  }
}
