import { BadRequestException, Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { TraceabilityService } from './traceability.service.js';
const id = (value: string) => { const parsed = entityIdSchema.safeParse(value); if (!parsed.success) throw new BadRequestException('Invalid identifier'); return parsed.data; };
@Controller('workspaces/:workspaceId/projects/:projectId/traceability')
@UseGuards(DevelopmentAuthGuard)
export class TraceabilityController {
  constructor(@Inject(TraceabilityService) private readonly service: TraceabilityService) {}
  @Get() list(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string }) {
    return this.service.list(res.locals.userId, id(p.workspaceId), id(p.projectId));
  }
}
