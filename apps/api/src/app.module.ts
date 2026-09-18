import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProjectModule } from './projects/project.module.js';
import { RequirementModule } from './requirements/requirement.module.js';
import { SourceModule } from './sources/source.module.js';
import { QuestionModule } from './questions/question.module.js';
import { BusinessRuleModule } from './business-rules/business-rule.module.js';
import { DecisionModule } from './decisions/decision.module.js';
import { SourceAnalysisModule } from './source-analyses/source-analysis.module.js';

@Module({
  imports: [
    ProjectModule,
    RequirementModule,
    SourceModule,
    QuestionModule,
    BusinessRuleModule,
    DecisionModule,
    SourceAnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
