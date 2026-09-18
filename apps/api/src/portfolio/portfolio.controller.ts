import { BadRequestException, Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { PortfolioService } from './portfolio.service.js';
const id = (value: string) => { const parsed = entityIdSchema.safeParse(value); if (!parsed.success) throw new BadRequestException('Invalid identifier'); return parsed.data; };
@Controller('workspaces/:workspaceId/projects/:projectId/readiness-portfolio')
@UseGuards(DevelopmentAuthGuard)
export class PortfolioController {
  constructor(@Inject(PortfolioService) private readonly service: PortfolioService) {}
  @Get() get(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string }) {
    return this.service.get(res.locals.userId, id(p.workspaceId), id(p.projectId));
  }
}
