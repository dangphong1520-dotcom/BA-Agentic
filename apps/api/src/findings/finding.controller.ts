import { BadRequestException, Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { FindingService } from './finding.service.js';

const id = (value: string) => {
  const parsed = entityIdSchema.safeParse(value);
  if (!parsed.success) throw new BadRequestException('Invalid identifier');
  return parsed.data;
};
@Controller('workspaces/:workspaceId/projects/:projectId/findings')
@UseGuards(DevelopmentAuthGuard)
export class FindingController {
  constructor(@Inject(FindingService) private readonly service: FindingService) {}
  @Get()
  list(
    @Res({ passthrough: true }) res: Response<unknown, { userId: string }>,
    @Param() params: { workspaceId: string; projectId: string },
  ) {
    return this.service.list(res.locals.userId, id(params.workspaceId), id(params.projectId));
  }
}
