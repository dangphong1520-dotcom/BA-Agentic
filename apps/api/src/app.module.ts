import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProjectModule } from './projects/project.module.js';
import { RequirementModule } from './requirements/requirement.module.js';
import { SourceModule } from './sources/source.module.js';
import { QuestionModule } from './questions/question.module.js';

@Module({
  imports: [ProjectModule, RequirementModule, SourceModule, QuestionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
