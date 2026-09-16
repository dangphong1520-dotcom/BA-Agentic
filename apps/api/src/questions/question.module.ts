import { Module } from '@nestjs/common';
import { ProjectModule } from '../projects/project.module.js';
import { RequirementModule } from '../requirements/requirement.module.js';
import { QuestionController } from './question.controller.js';
import { QuestionRepository } from './question.repository.js';
import { QuestionService } from './question.service.js';
@Module({
  imports: [ProjectModule, RequirementModule],
  controllers: [QuestionController],
  providers: [QuestionRepository, QuestionService],
})
export class QuestionModule {}
