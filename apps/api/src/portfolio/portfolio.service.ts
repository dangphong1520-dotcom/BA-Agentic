import { Inject, Injectable } from '@nestjs/common';
import { readinessPortfolioSchema, type ReadinessPortfolio } from '@ba/contracts';
import { RequirementService } from '../requirements/requirement.service.js';

@Injectable()
export class PortfolioService {
  constructor(@Inject(RequirementService) private readonly requirements: RequirementService) {}
  async get(user: string, workspace: string, project: string): Promise<ReadinessPortfolio> {
    const rows = await this.requirements.list(user, workspace, project);
    const assessments = await Promise.all(rows.map((row) => this.requirements.readiness(user, workspace, project, row.id)));
    const items = rows.map((row, index) => ({
      requirementId: row.id,
      title: row.title,
      lifecycleStatus: row.status,
      version: row.version,
      readinessStatus: assessments[index].status,
      failedChecks: assessments[index].checks.filter((check) => !check.passed),
    }));
    return readinessPortfolioSchema.parse({
      total: items.length,
      ready: items.filter((item) => item.readinessStatus === 'READY').length,
      conditional: items.filter((item) => item.readinessStatus === 'CONDITIONAL').length,
      notReady: items.filter((item) => item.readinessStatus === 'NOT_READY').length,
      items,
    });
  }
}
