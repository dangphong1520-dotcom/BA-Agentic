import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { SourceController } from './source.controller.js';
import { SourceRepository } from './source.repository.js';
import { SourceService } from './source.service.js';
@Module({
  imports: [ProjectModule],
  controllers: [SourceController],
  providers: [SourceRepository, SourceService],
})
export class SourceModule {}
