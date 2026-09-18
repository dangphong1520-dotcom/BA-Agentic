import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import {
  sourceAnalysisDtoSchema,
  sourceDtoSchema,
  type SourceAnalysisDto,
} from '@ba/contracts';
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
    let run: SourceAnalysisDto;

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
      run = sourceAnalysisDtoSchema.parse(response.body);
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

    it('lets BA edit a proposal with optimistic concurrency', async () => {
      const requirement = run.result!.requirement;
      const response = await api()
        .patch(`${base()}/source-analyses/${runId}/proposal`)
        .set('Authorization', auth())
        .send({
          expectedVersion: run.version,
          title: 'Thanh toán đơn hàng trực tuyến',
          type: requirement.type,
          priority: 'MUST',
          description: requirement.description,
          businessGoal: requirement.businessGoal,
          actor: requirement.actor,
          preconditions: requirement.preconditions,
          mainFlow: requirement.mainFlow,
          exceptionFlow: requirement.exceptionFlow,
          acceptanceCriteria: 'Khách hàng hoàn tất thanh toán thành công.',
          sourceNote: requirement.sourceNote,
        })
        .expect(200);
      run = sourceAnalysisDtoSchema.parse(response.body);
      expect(run).toMatchObject({ version: 2, reviewStatus: 'PENDING' });
      expect(run.result?.requirement).toMatchObject({
        title: 'Thanh toán đơn hàng trực tuyến',
        priority: 'MUST',
        classification: requirement.classification,
        evidenceSegmentIds: requirement.evidenceSegmentIds,
      });
      await api()
        .patch(`${base()}/source-analyses/${runId}/proposal`)
        .set('Authorization', auth())
        .send({ ...run.result?.requirement, expectedVersion: 2, reviewedBy: context().token })
        .expect(400);
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

    it('accepts a proposal once and creates versioned traceable knowledge atomically', async () => {
      const db = context().app.get(DatabaseService).db;
      const before = await db.requirement.count();
      const responses = await Promise.all([
        api()
          .post(`${base()}/source-analyses/${runId}/accept`)
          .set('Authorization', auth())
          .send({ expectedVersion: run.version }),
        api()
          .post(`${base()}/source-analyses/${runId}/accept`)
          .set('Authorization', auth())
          .send({ expectedVersion: run.version }),
      ]);
      expect(responses.map((response) => response.status).sort()).toEqual([
        201, 409,
      ]);
      const accepted = sourceAnalysisDtoSchema.parse(
        responses.find((response) => response.status === 201)!.body,
      );
      expect(accepted).toMatchObject({
        reviewStatus: 'ACCEPTED',
        version: 3,
      });
      expect(accepted.acceptedRequirementId).toBeTruthy();
      expect(await db.requirement.count()).toBe(before + 1);
      const requirement = await db.requirement.findUniqueOrThrow({
        where: { id: accepted.acceptedRequirementId! },
        include: { versions: true, evidence: true },
      });
      expect(requirement).toMatchObject({
        status: 'DRAFT',
        title: 'Thanh toán đơn hàng trực tuyến',
        priority: 'MUST',
      });
      expect(requirement.versions).toHaveLength(1);
      expect(requirement.evidence).toHaveLength(
        run.result!.requirement.evidenceSegmentIds.length,
      );
      run = accepted;
      await api()
        .post(`${base()}/source-analyses/${runId}/reject`)
        .set('Authorization', auth())
        .send({ expectedVersion: run.version })
        .expect(409);
    });

    it('can reject a separate proposal without creating a requirement', async () => {
      const db = context().app.get(DatabaseService).db;
      const before = await db.requirement.count();
      const created = await api()
        .post(`${base()}/sources/${sourceId}/analyses`)
        .set('Authorization', auth())
        .send({})
        .expect(201);
      const proposal = sourceAnalysisDtoSchema.parse(created.body);
      const rejected = await api()
        .post(`${base()}/source-analyses/${proposal.id}/reject`)
        .set('Authorization', auth())
        .send({ expectedVersion: proposal.version })
        .expect(201);
      expect(sourceAnalysisDtoSchema.parse(rejected.body)).toMatchObject({
        reviewStatus: 'REJECTED',
        version: 2,
      });
      expect(await db.requirement.count()).toBe(before);
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
        reviewStatus: 'ACCEPTED',
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
