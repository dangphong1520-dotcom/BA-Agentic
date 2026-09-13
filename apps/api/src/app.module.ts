import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProjectModule } from './projects/project.module.js';
import { RequirementModule } from './requirements/requirement.module.js';

@Module({
  imports: [ProjectModule, RequirementModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
