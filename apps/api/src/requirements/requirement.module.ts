import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { RequirementController } from './requirement.controller.js';
import { RequirementRepository } from './requirement.repository.js';
import { RequirementService } from './requirement.service.js';
@Module({
  imports: [ProjectModule],
  controllers: [RequirementController],
  providers: [RequirementRepository, RequirementService],
  exports: [RequirementService],
})
export class RequirementModule {}
