import { Module } from '@nestjs/common';
import { RequirementModule } from '../requirements/requirement.module.js';
import { ProjectModule } from '../projects/project.module.js';
import { DesignStudioController } from './design-studio.controller.js';
import { DesignStudioService } from './design-studio.service.js';
import { DesignStudioGateway } from './design-studio.gateway.js';
import { DesignStudioRepository } from './design-studio.repository.js';
@Module({ imports: [RequirementModule, ProjectModule], controllers: [DesignStudioController], providers: [DesignStudioService, DesignStudioGateway, DesignStudioRepository] })
export class DesignStudioModule {}
