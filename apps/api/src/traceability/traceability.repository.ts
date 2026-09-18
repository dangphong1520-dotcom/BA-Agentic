import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class TraceabilityRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  list(workspaceId: string, projectId: string) {
    return this.database.db.requirement.findMany({
      where: { workspaceId, projectId },
      include: {
        evidence: { select: { segment: { select: { sourceId: true } } } },
        _count: { select: { questions: true, businessRuleLinks: true, decisionLinks: true } },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: 100,
    });
  }
  openQuestionCounts(projectId: string) {
    return this.database.db.question.groupBy({
      by: ['requirementId'],
      where: { projectId, requirementId: { not: null }, status: { not: 'CLOSED' } },
      _count: { _all: true },
    });
  }
}
