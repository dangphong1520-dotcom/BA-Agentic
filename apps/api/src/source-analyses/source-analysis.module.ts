import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { SourceModule } from '../sources/source.module.js';
import { SourceAnalysisController } from './source-analysis.controller.js';
import { SourceAnalysisGateway } from './source-analysis.gateway.js';
import { SourceAnalysisRepository } from './source-analysis.repository.js';
import { SourceAnalysisService } from './source-analysis.service.js';
@Module({
  imports: [ProjectModule, SourceModule],
  controllers: [SourceAnalysisController],
  providers: [
    SourceAnalysisGateway,
    SourceAnalysisRepository,
    SourceAnalysisService,
  ],
})
export class SourceAnalysisModule {}
