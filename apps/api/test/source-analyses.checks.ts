import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { sourceAnalysisDtoSchema, sourceDtoSchema } from '@ba/contracts';
import { DatabaseService } from '../src/database/database.service.js';

export function sourceAnalysisChecks(
  context: () => {
    app: INestApplication<App>;
    token: string;
    workspaceId: string;
    projectId: string;
    foreignWorkspace: string;
    foreignProject: string;
  },
  restart: () => Promise<void>,
) {
  describe('Source-to-requirement analysis', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () =>
      `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}`;
    let sourceId: string;
    let runId: string;

    it('persists a structured proposal without creating domain knowledge', async () => {
      const created = await api()
        .post(`${base()}/sources`)
        .set('Authorization', auth())
        .send({
          title: 'Checkout notes',
          type: 'MEETING',
          content:
            'Khách hàng cần thanh toán đơn hàng trực tuyến.\nCần làm rõ phương thức thanh toán.',
        })
        .expect(201);
      const source = sourceDtoSchema.parse(created.body);
      sourceId = source.id;
      const db = context().app.get(DatabaseService).db;
      const before = await Promise.all([
        db.requirement.count(),
        db.question.count(),
        db.businessRule.count(),
        db.decision.count(),
      ]);
      const response = await api()
        .post(`${base()}/sources/${sourceId}/analyses`)
        .set('Authorization', auth())
        .send({})
        .expect(201);
      const run = sourceAnalysisDtoSchema.parse(response.body);
      runId = run.id;
      expect(run).toMatchObject({
        status: 'COMPLETED',
        sourceRevision: 1,
        sourceId,
      });
      expect(run.result?.requirement.classification).toBe('PROPOSAL');
      expect(run.result?.requirement.evidenceSegmentIds).toEqual(
        source.segments.map((row) => row.id),
      );
      expect(
        await Promise.all([
          db.requirement.count(),
          db.question.count(),
          db.businessRule.count(),
          db.decision.count(),
        ]),
      ).toEqual(before);
    });

    it('enforces authentication and tenant scope', async () => {
      await api()
        .post(`${base()}/sources/${sourceId}/analyses`)
        .send({})
        .expect(401);
      const foreign = `/api/v1/workspaces/${context().foreignWorkspace}/projects/${context().foreignProject}`;
      await api()
        .post(`${foreign}/sources/${sourceId}/analyses`)
        .set('Authorization', auth())
        .send({})
        .expect(404);
      await api()
        .get(`${foreign}/source-analyses/${runId}`)
        .set('Authorization', auth())
        .expect(404);
    });

    it('persists validation failure without partial result', async () => {
      const created = await api()
        .post(`${base()}/sources`)
        .set('Authorization', auth())
        .send({
          title: 'Invalid provider fixture',
          type: 'MANUAL_INPUT',
          content: '[[INVALID_ANALYSIS]]',
        })
        .expect(201);
      const response = await api()
        .post(`${base()}/sources/${created.body.id}/analyses`)
        .set('Authorization', auth())
        .send({})
        .expect(201);
      expect(sourceAnalysisDtoSchema.parse(response.body)).toMatchObject({
        status: 'FAILED',
        result: null,
        errorCode: 'ANALYSIS_VALIDATION_FAILED',
      });
    });

    it('preserves completed runs across restart', async () => {
      await restart();
      const response = await api()
        .get(`${base()}/source-analyses/${runId}`)
        .set('Authorization', auth())
        .expect(200);
      expect(sourceAnalysisDtoSchema.parse(response.body)).toMatchObject({
        id: runId,
        status: 'COMPLETED',
      });
      const list = await api()
        .get(`${base()}/sources/${sourceId}/analyses`)
        .set('Authorization', auth())
        .expect(200);
      expect(
        sourceAnalysisDtoSchema
          .array()
          .parse(list.body)
          .some((row) => row.id === runId),
      ).toBe(true);
    });
  });
}
