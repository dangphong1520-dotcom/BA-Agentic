import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { SourceAnalysisService } from './source-analysis.service.js';

type Params = {
  workspaceId: string;
  projectId: string;
  sourceId: string;
  id: string;
};
const id = (value: string) => {
  const parsed = entityIdSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException('Invalid identifier');
  return parsed.data;
};
@Controller('workspaces/:workspaceId/projects/:projectId')
@UseGuards(DevelopmentAuthGuard)
export class SourceAnalysisController {
  constructor(
    @Inject(SourceAnalysisService)
    private readonly service: SourceAnalysisService,
  ) {}
  @Post('sources/:sourceId/analyses') create(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
  ) {
    return this.service.create(
      res.locals.userId,
      id(p.workspaceId),
      id(p.projectId),
      id(p.sourceId),
    );
  }
  @Get('sources/:sourceId/analyses') list(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
  ) {
    return this.service.list(
      res.locals.userId,
      id(p.workspaceId),
      id(p.projectId),
      id(p.sourceId),
    );
  }
  @Get('source-analyses/:id') get(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() p: Params,
  ) {
    return this.service.get(
      res.locals.userId,
      id(p.workspaceId),
      id(p.projectId),
      id(p.id),
    );
  }
}
