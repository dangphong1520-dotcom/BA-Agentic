import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { requirementDtoSchema, requirementVersionSchema } from '@ba/contracts';

export function requirementLifecycleChecks(
  context: () => {
    app: INestApplication<App>;
    token: string;
    userId: string;
    workspaceId: string;
    projectId: string;
    foreignWorkspace: string;
    foreignProject: string;
  },
  restart: () => Promise<void>,
) {
  describe('Governed requirement lifecycle', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () =>
      `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}/requirements`;
    const fields = {
      title: 'Lifecycle requirement',
      type: 'FUNCTIONAL',
      priority: 'MUST',
      description: 'A governed requirement ready for review.',
      businessGoal: 'Preserve human authority',
      actor: 'Business Analyst',
      preconditions: '',
      mainFlow: 'Review then approve',
      exceptionFlow: '',
      acceptanceCriteria: 'Approval and baseline are recorded with identity.',
      sourceNote: 'Manual lifecycle test',
    };
    let id: string;

    it('requires quality fields before review and rejects direct escalation', async () => {
      const incomplete = await api()
        .post(base())
        .set('Authorization', auth())
        .send({ ...fields, description: '', acceptanceCriteria: '' })
        .expect(201);
      await api()
        .post(`${base()}/${incomplete.body.id}/ready-for-review`)
        .set('Authorization', auth())
        .send({ expectedVersion: 1 })
        .expect(409);
      await api()
        .post(`${base()}/${incomplete.body.id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 1 })
        .expect(409);
      await api()
        .post(`${base()}/${incomplete.body.id}/baseline`)
        .set('Authorization', auth())
        .send({ expectedVersion: 1 })
        .expect(409);
    });

    it('creates a draft with empty governance metadata', async () => {
      const result = await api()
        .post(base())
        .set('Authorization', auth())
        .send(fields)
        .expect(201);
      const row = requirementDtoSchema.parse(result.body);
      id = row.id;
      expect(row).toMatchObject({
        status: 'DRAFT',
        version: 1,
        approvedBy: null,
        approvedAt: null,
        baselinedBy: null,
        baselinedAt: null,
      });
    });

    it('isolates lifecycle commands by authentication and project scope', async () => {
      await api()
        .post(`${base()}/${id}/ready-for-review`)
        .send({ expectedVersion: 1 })
        .expect(401);
      const c = context();
      const foreign = `/api/v1/workspaces/${c.foreignWorkspace}/projects/${c.foreignProject}/requirements/${id}`;
      for (const action of [
        'request-clarification',
        'ready-for-review',
        'approve',
        'baseline',
      ])
        await api()
          .post(`${foreign}/${action}`)
          .set('Authorization', auth())
          .send({ expectedVersion: 1 })
          .expect(404);
    });

    it('permits one concurrent transition and records one snapshot', async () => {
      const results = await Promise.all([
        api()
          .post(`${base()}/${id}/ready-for-review`)
          .set('Authorization', auth())
          .send({ expectedVersion: 1 }),
        api()
          .post(`${base()}/${id}/ready-for-review`)
          .set('Authorization', auth())
          .send({ expectedVersion: 1 }),
      ]);
      expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
      expect(
        requirementDtoSchema.parse(
          results.find((result) => result.status === 201)!.body,
        ),
      ).toMatchObject({ status: 'READY_FOR_REVIEW', version: 2 });
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(history.body).toHaveLength(2);
    });

    it('returns to clarification, permits edits, and becomes ready again', async () => {
      await api()
        .post(`${base()}/${id}/request-clarification`)
        .set('Authorization', auth())
        .send({ expectedVersion: 2 })
        .expect(201)
        .expect(({ body }) =>
          expect(body).toMatchObject({
            status: 'CLARIFICATION_REQUIRED',
            version: 3,
          }),
        );
      await api()
        .patch(`${base()}/${id}`)
        .set('Authorization', auth())
        .send({ ...fields, title: 'Clarified requirement', expectedVersion: 3 })
        .expect(200)
        .expect(({ body }) =>
          expect(body).toMatchObject({
            status: 'CLARIFICATION_REQUIRED',
            version: 4,
          }),
        );
      await api()
        .post(`${base()}/${id}/ready-for-review`)
        .set('Authorization', auth())
        .send({ expectedVersion: 4 })
        .expect(201)
        .expect(({ body }) =>
          expect(body).toMatchObject({
            status: 'READY_FOR_REVIEW',
            version: 5,
          }),
        );
    });

    it('records human approval and baseline and locks content', async () => {
      await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 5, approvedBy: context().userId })
        .expect(400);
      const approved = await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 5 })
        .expect(201);
      expect(requirementDtoSchema.parse(approved.body)).toMatchObject({
        status: 'APPROVED',
        version: 6,
        approvedBy: context().userId,
        baselinedBy: null,
      });
      expect(approved.body.approvedAt).not.toBeNull();
      await api()
        .patch(`${base()}/${id}`)
        .set('Authorization', auth())
        .send({ ...fields, expectedVersion: 6 })
        .expect(409);
      await api()
        .post(`${base()}/${id}/baseline`)
        .set('Authorization', auth())
        .send({ expectedVersion: 6, baselinedBy: context().userId })
        .expect(400);
      const baseline = await api()
        .post(`${base()}/${id}/baseline`)
        .set('Authorization', auth())
        .send({ expectedVersion: 6 })
        .expect(201);
      expect(requirementDtoSchema.parse(baseline.body)).toMatchObject({
        status: 'BASELINED',
        version: 7,
        approvedBy: context().userId,
        baselinedBy: context().userId,
      });
      expect(baseline.body.baselinedAt).not.toBeNull();
      await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 7 })
        .expect(409);
    });

    it('persists baseline and full transition history across restart', async () => {
      await restart();
      const result = await api()
        .get(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(200);
      expect(requirementDtoSchema.parse(result.body)).toMatchObject({
        status: 'BASELINED',
        version: 7,
      });
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      const rows = requirementVersionSchema.array().parse(history.body);
      expect(rows).toHaveLength(7);
      expect(rows.map((row) => row.snapshot.status)).toEqual([
        'BASELINED',
        'APPROVED',
        'READY_FOR_REVIEW',
        'CLARIFICATION_REQUIRED',
        'CLARIFICATION_REQUIRED',
        'READY_FOR_REVIEW',
        'DRAFT',
      ]);
    });
  });
}
