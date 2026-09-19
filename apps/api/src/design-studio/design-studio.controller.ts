import { BadRequestException, Body, Controller, Get, Inject, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { designReviewSchema, entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { DesignStudioService } from './design-studio.service.js';
const id = (value: string) => { const parsed = entityIdSchema.safeParse(value); if (!parsed.success) throw new BadRequestException('Invalid identifier'); return parsed.data; };
const review = (value: unknown) => { const parsed = designReviewSchema.safeParse(value); if (!parsed.success) throw new BadRequestException('Invalid review'); return parsed.data.expectedRevision; };
@Controller('workspaces/:workspaceId/projects/:projectId/requirements/:id/design') @UseGuards(DevelopmentAuthGuard)
export class DesignStudioController {
  constructor(@Inject(DesignStudioService) private readonly service: DesignStudioService) {}
  private args(res: Response<unknown, { userId: string }>, p: { workspaceId: string; projectId: string; id: string }) { return [res.locals.userId, id(p.workspaceId), id(p.projectId), id(p.id)] as const; }
  @Get('preview') preview(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; id: string }) { return this.service.preview(...this.args(res, p)); }
  @Get('artifacts') list(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; id: string }) { return this.service.list(...this.args(res, p)); }
  @Post('artifacts') create(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; id: string }) { return this.service.create(...this.args(res, p)); }
  @Post('artifacts/:artifactId/accept') accept(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; id: string; artifactId: string }, @Body() body: unknown) { return this.service.accept(res.locals.userId, id(p.workspaceId), id(p.projectId), id(p.id), id(p.artifactId), review(body)); }
  @Post('artifacts/:artifactId/reject') reject(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; id: string; artifactId: string }, @Body() body: unknown) { return this.service.reject(res.locals.userId, id(p.workspaceId), id(p.projectId), id(p.id), id(p.artifactId), review(body)); }
}
