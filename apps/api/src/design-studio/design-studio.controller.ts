import { BadRequestException, Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { DesignStudioService } from './design-studio.service.js';
const id = (value: string) => { const parsed = entityIdSchema.safeParse(value); if (!parsed.success) throw new BadRequestException('Invalid identifier'); return parsed.data; };
@Controller('workspaces/:workspaceId/projects/:projectId/requirements/:id/design-preview')
@UseGuards(DevelopmentAuthGuard)
export class DesignStudioController {
  constructor(@Inject(DesignStudioService) private readonly service: DesignStudioService) {}
  @Get() get(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; id: string }) {
    return this.service.preview(res.locals.userId, id(p.workspaceId), id(p.projectId), id(p.id));
  }
}
