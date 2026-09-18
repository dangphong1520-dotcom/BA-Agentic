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
import { FindingModule } from './findings/finding.module.js';
import { TraceabilityModule } from './traceability/traceability.module.js';
import { PortfolioModule } from './portfolio/portfolio.module.js';

@Module({
  imports: [
    ProjectModule,
    RequirementModule,
    SourceModule,
    QuestionModule,
    BusinessRuleModule,
    DecisionModule,
    SourceAnalysisModule,
    FindingModule,
    TraceabilityModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
