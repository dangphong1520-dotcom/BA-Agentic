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
  approveBusinessRuleSchema,
  createBusinessRuleSchema,
  entityIdSchema,
  updateBusinessRuleSchema,
} from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { BusinessRuleService } from './business-rule.service.js';

function id(value: string) {
  const parsed = entityIdSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException('Invalid identifier');
  return parsed.data;
}

@Controller('workspaces/:workspaceId/projects/:projectId/business-rules')
@UseGuards(DevelopmentAuthGuard)
export class BusinessRuleController {
  constructor(
    @Inject(BusinessRuleService)
    private readonly service: BusinessRuleService,
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
    const parsed = createBusinessRuleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid business rule');
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
    @Param('id') rule: string,
  ) {
    return this.service.history(
      response.locals.userId,
      id(workspace),
      id(project),
      id(rule),
    );
  }

  @Get(':id')
  get(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') rule: string,
  ) {
    return this.service.get(
      response.locals.userId,
      id(workspace),
      id(project),
      id(rule),
    );
  }

  @Patch(':id')
  update(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') rule: string,
    @Body() body: unknown,
  ) {
    const parsed = updateBusinessRuleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid business rule');
    return this.service.update(
      response.locals.userId,
      id(workspace),
      id(project),
      id(rule),
      parsed.data,
    );
  }

  @Post(':id/approve')
  approve(
    @Res({ passthrough: true }) response: Response,
    @Param('workspaceId') workspace: string,
    @Param('projectId') project: string,
    @Param('id') rule: string,
    @Body() body: unknown,
  ) {
    const parsed = approveBusinessRuleSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid approval');
    return this.service.approve(
      response.locals.userId,
      id(workspace),
      id(project),
      id(rule),
      parsed.data.expectedVersion,
    );
  }
}
