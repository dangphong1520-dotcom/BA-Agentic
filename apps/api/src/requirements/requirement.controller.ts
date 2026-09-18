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
  createRequirementSchema,
  entityIdSchema,
  updateRequirementSchema,
  requirementTransitionSchema,
} from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { RequirementService } from './requirement.service.js';

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
type Params = { workspaceId: string; projectId: string; id?: string };
function scope(params: Params): [string, string] {
  return [
    parse(entityIdSchema, params.workspaceId),
    parse(entityIdSchema, params.projectId),
  ];
}
@Controller('workspaces/:workspaceId/projects/:projectId/requirements')
@UseGuards(DevelopmentAuthGuard)
export class RequirementController {
  constructor(
    @Inject(RequirementService) private readonly service: RequirementService,
  ) {}
  @Get()
  list(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: Params,
  ) {
    return this.service.list(res.locals.userId, ...scope(params));
  }
  @Post()
  create(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: Params,
    @Body() body: unknown,
  ) {
    return this.service.create(
      res.locals.userId,
      ...scope(params),
      parse(createRequirementSchema, body),
    );
  }
  @Get(':id')
  get(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: Params,
  ) {
    return this.service.get(
      res.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
    );
  }
  @Get(':id/versions')
  history(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: Params,
  ) {
    return this.service.history(
      res.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
    );
  }
  @Get(':id/readiness')
  readiness(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: Params,
  ) {
    return this.service.readiness(
      res.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
    );
  }
  @Patch(':id')
  update(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: Params,
    @Body() body: unknown,
  ) {
    return this.service.update(
      res.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
      parse(updateRequirementSchema, body),
    );
  }

  private transitionBody(body: unknown) {
    const parsed = requirementTransitionSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid transition');
    return parsed.data.expectedVersion;
  }

  @Post(':id/request-clarification')
  requestClarification(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param() params: Params,
    @Body() body: unknown,
  ) {
    return this.service.requestClarification(
      response.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
      this.transitionBody(body),
    );
  }

  @Post(':id/ready-for-review')
  readyForReview(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param() params: Params,
    @Body() body: unknown,
  ) {
    return this.service.readyForReview(
      response.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
      this.transitionBody(body),
    );
  }

  @Post(':id/approve')
  approve(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param() params: Params,
    @Body() body: unknown,
  ) {
    return this.service.approve(
      response.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
      this.transitionBody(body),
    );
  }

  @Post(':id/baseline')
  baseline(
    @Res({ passthrough: true }) response: Response<unknown, { userId: string }>,
    @Param() params: Params,
    @Body() body: unknown,
  ) {
    return this.service.baseline(
      response.locals.userId,
      ...scope(params),
      parse(entityIdSchema, params.id),
      this.transitionBody(body),
    );
  }
}
