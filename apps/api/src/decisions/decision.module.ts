import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { RequirementModule } from '../requirements/requirement.module.js';
import { DecisionController } from './decision.controller.js';
import { DecisionRepository } from './decision.repository.js';
import { DecisionService } from './decision.service.js';

@Module({
  imports: [ProjectModule, RequirementModule],
  controllers: [DecisionController],
  providers: [DecisionRepository, DecisionService],
})
export class DecisionModule {}
