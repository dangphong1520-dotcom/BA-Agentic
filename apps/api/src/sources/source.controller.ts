import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  createSourceSchema,
  entityIdSchema,
  linkEvidenceSchema,
} from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { SourceService } from './source.service.js';
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
type Params = { workspaceId: string; projectId: string; id: string };
const scope = (params: Params): [string, string] => [
  parse(entityIdSchema, params.workspaceId),
  parse(entityIdSchema, params.projectId),
];
@Controller('workspaces/:workspaceId/projects/:projectId')
@UseGuards(DevelopmentAuthGuard)
export class SourceController {
  constructor(@Inject(SourceService) private readonly service: SourceService) {}
  @Get('sources')
  list(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
  ) {
    return this.service.list(res.locals.userId, ...scope(p));
  }
  @Post('sources')
  create(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
    @Body() body: unknown,
  ) {
    return this.service.create(
      res.locals.userId,
      ...scope(p),
      parse(createSourceSchema, body),
    );
  }
  @Get('sources/:id')
  get(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
  ) {
    return this.service.get(
      res.locals.userId,
      ...scope(p),
      parse(entityIdSchema, p.id),
    );
  }
  @Get('requirements/:id/evidence')
  evidence(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
  ) {
    return this.service.evidence(
      res.locals.userId,
      ...scope(p),
      parse(entityIdSchema, p.id),
    );
  }
  @Post('requirements/:id/evidence')
  link(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
    @Body() body: unknown,
  ) {
    return this.service.link(
      res.locals.userId,
      ...scope(p),
      parse(entityIdSchema, p.id),
      parse(linkEvidenceSchema, body),
    );
  }
}
