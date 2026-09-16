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
  createQuestionSchema,
  entityIdSchema,
  updateQuestionSchema,
} from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { QuestionService } from './question.service.js';

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
@Controller('workspaces/:workspaceId/projects/:projectId/questions')
@UseGuards(DevelopmentAuthGuard)
export class QuestionController {
  constructor(
    @Inject(QuestionService) private readonly service: QuestionService,
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
      parse(createQuestionSchema, body),
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
      parse(updateQuestionSchema, body),
    );
  }
}
