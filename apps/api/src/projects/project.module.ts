import { Module } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { DevelopmentAuthGuard } from '../auth/development-auth.guard.js';
import { ProjectController } from './project.controller.js';
import { ProjectRepository } from './project.repository.js';
import { ProjectService } from './project.service.js';

@Module({
  controllers: [ProjectController],
  providers: [
    DatabaseService,
    DevelopmentAuthGuard,
    ProjectRepository,
    ProjectService,
  ],
})
export class ProjectModule {}
