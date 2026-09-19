import { Module } from '@nestjs/common';
import { RequirementModule } from '../requirements/requirement.module.js';
import { DesignStudioController } from './design-studio.controller.js';
import { DesignStudioService } from './design-studio.service.js';
@Module({ imports: [RequirementModule], controllers: [DesignStudioController], providers: [DesignStudioService] })
export class DesignStudioModule {}
