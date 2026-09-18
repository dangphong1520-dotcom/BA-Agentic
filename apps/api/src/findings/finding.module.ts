import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { FindingController } from './finding.controller.js';
import { FindingRepository } from './finding.repository.js';
import { FindingService } from './finding.service.js';
@Module({ imports: [ProjectModule], controllers: [FindingController], providers: [FindingRepository, FindingService] })
export class FindingModule {}
