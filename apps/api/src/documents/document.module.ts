import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { RequirementModule } from '../requirements/requirement.module.js';
import { DocumentController } from './document.controller.js';
import { DocumentService } from './document.service.js';
@Module({ imports: [ProjectModule, RequirementModule], controllers: [DocumentController], providers: [DocumentService] })
export class DocumentModule {}
