import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { RequirementModule } from '../requirements/requirement.module.js';
import { BusinessRuleController } from './business-rule.controller.js';
import { BusinessRuleRepository } from './business-rule.repository.js';
import { BusinessRuleService } from './business-rule.service.js';

@Module({
  imports: [ProjectModule, RequirementModule],
  controllers: [BusinessRuleController],
  providers: [BusinessRuleRepository, BusinessRuleService],
})
export class BusinessRuleModule {}
