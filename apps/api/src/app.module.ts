import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ProjectModule } from './projects/project.module.js';

@Module({
  imports: [ProjectModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
