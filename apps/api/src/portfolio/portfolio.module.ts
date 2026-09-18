import { Module } from '@nestjs/common';
import { RequirementModule } from '../requirements/requirement.module.js';
import { PortfolioController } from './portfolio.controller.js';
import { PortfolioService } from './portfolio.service.js';
@Module({ imports: [RequirementModule], controllers: [PortfolioController], providers: [PortfolioService] })
export class PortfolioModule {}
