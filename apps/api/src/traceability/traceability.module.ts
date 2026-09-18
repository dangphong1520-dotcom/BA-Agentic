import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { TraceabilityController } from './traceability.controller.js';
import { TraceabilityRepository } from './traceability.repository.js';
import { TraceabilityService } from './traceability.service.js';
@Module({ imports: [ProjectModule], controllers: [TraceabilityController], providers: [TraceabilityRepository, TraceabilityService] })
export class TraceabilityModule {}
