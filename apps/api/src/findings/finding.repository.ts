import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class FindingRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  list(userId: string, workspaceId: string, projectId: string) {
    return this.database.db.sourceAnalysis.findMany({
      where: {
        workspaceId,
        projectId,
        status: 'COMPLETED',
        project: { members: { some: { userId } } },
      },
      include: { source: { select: { title: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });
  }
}
