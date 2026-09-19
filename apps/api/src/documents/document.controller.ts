import { BadRequestException, Controller, Get, Inject, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { documentFormatSchema, entityIdSchema } from '@ba/contracts';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { DocumentService } from './document.service.js';
const parse = <T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } }, value: unknown) => { const result = schema.safeParse(value); if (!result.success) throw new BadRequestException('Invalid document request'); return result.data; };
@Controller('workspaces/:workspaceId/projects/:projectId/documents') @UseGuards(DevelopmentAuthGuard)
export class DocumentController {
  constructor(@Inject(DocumentService) private readonly service: DocumentService) {}
  @Get(':format/preview') preview(@Res({ passthrough: true }) res: Response<unknown, { userId: string }>, @Param() p: { workspaceId: string; projectId: string; format: string }) { return this.service.preview(res.locals.userId, parse(entityIdSchema, p.workspaceId), parse(entityIdSchema, p.projectId), parse(documentFormatSchema, p.format)); }
}
