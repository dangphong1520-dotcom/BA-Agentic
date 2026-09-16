import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { decisionDtoSchema, decisionVersionSchema } from '@ba/contracts';
import { DatabaseService } from '../src/database/database.service.js';

export function decisionChecks(
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
  describe('Governed decisions', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () =>
      `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}/decisions`;
    const fields = {
      title: 'Chọn quy trình hoàn tiền',
      description: 'Áp dụng quy trình phê duyệt hai bước.',
      rationale: 'Giảm rủi ro hoàn tiền sai người hoặc sai số tiền.',
      requirementIds: [] as string[],
    };
    let id: string;
    let replacementId: string;
    let requirementId: string;

    it('rejects unauthenticated, invalid and caller-controlled fields', async () => {
      await api().get(base()).expect(401);
      for (const invalid of [
        { title: ' ' },
        { description: ' ' },
        { rationale: ' ' },
        { status: 'APPROVED' },
        { code: 'DEC-FORGED00' },
        { createdBy: context().userId },
        { decidedBy: context().userId },
        { decisionDate: new Date().toISOString() },
      ])
        await api()
          .post(base())
          .set('Authorization', auth())
          .send({ ...fields, ...invalid })
          .expect(400);
    });

    it('creates a linked proposal with server metadata and history', async () => {
      const db = context().app.get(DatabaseService).db;
      requirementId = (
        await db.requirement.findFirstOrThrow({
          where: { projectId: context().projectId },
        })
      ).id;
      const result = await api()
        .post(base())
        .set('Authorization', auth())
        .send({ ...fields, requirementIds: [requirementId] })
        .expect(201);
      const row = decisionDtoSchema.parse(result.body);
      id = row.id;
      expect(row).toMatchObject({
        status: 'PROPOSED',
        version: 1,
        createdBy: context().userId,
        decidedBy: null,
        decisionDate: null,
        supersededById: null,
        requirementIds: [requirementId],
      });
      expect(row.code).toMatch(/^DEC-[0-9A-F]{8}$/);
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(
        decisionVersionSchema.array().parse(history.body)[0].snapshot,
      ).toEqual(row);
    });

    it('enforces tenant and cross-project requirement boundaries', async () => {
      const c = context();
      const foreignBase = `/api/v1/workspaces/${c.foreignWorkspace}/projects/${c.foreignProject}/decisions`;
      for (const suffix of ['', `/${id}`, `/${id}/versions`])
        await api()
          .get(foreignBase + suffix)
          .set('Authorization', auth())
          .expect(404);
      const db = c.app.get(DatabaseService).db;
      const original = await db.requirement.findUniqueOrThrow({
        where: { id: requirementId },
      });
      const foreign = await db.requirement.create({
        data: {
          ...original,
          id: undefined,
          workspaceId: c.foreignWorkspace,
          projectId: c.foreignProject,
        },
      });
      await api()
        .post(base())
        .set('Authorization', auth())
        .send({ ...fields, requirementIds: [foreign.id] })
        .expect(404);
      await expect(
        db.decisionRequirement.create({
          data: {
            projectId: c.projectId,
            decisionId: id,
            requirementId: foreign.id,
          },
        }),
      ).rejects.toThrow();
    });

    it('allows one concurrent proposal edit and preserves both snapshots', async () => {
      const results = await Promise.all(
        ['Quy trình hai bước đã rà soát', 'Quy trình thay thế'].map((title) =>
          api()
            .patch(`${base()}/${id}`)
            .set('Authorization', auth())
            .send({
              ...fields,
              title,
              requirementIds: [requirementId],
              expectedVersion: 1,
            }),
        ),
      );
      expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
      const row = decisionDtoSchema.parse(
        results.find((result) => result.status === 200)!.body,
      );
      expect(row.version).toBe(2);
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(history.body).toHaveLength(2);
      expect(history.body[0].snapshot).toEqual(row);
    });

    it('records explicit human approval and locks decision content', async () => {
      await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 2, decidedBy: context().userId })
        .expect(400);
      const result = await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 2 })
        .expect(201);
      expect(decisionDtoSchema.parse(result.body)).toMatchObject({
        status: 'APPROVED',
        version: 3,
        decidedBy: context().userId,
        requirementIds: [requirementId],
      });
      expect(result.body.decisionDate).not.toBeNull();
      await api()
        .patch(`${base()}/${id}`)
        .set('Authorization', auth())
        .send({
          ...fields,
          requirementIds: [requirementId],
          expectedVersion: 3,
        })
        .expect(409);
      await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 3 })
        .expect(409);
    });

    it('supersedes only with another approved decision in the same project', async () => {
      const proposed = await api()
        .post(base())
        .set('Authorization', auth())
        .send({
          ...fields,
          title: 'Quy trình hoàn tiền tự động',
          rationale: 'Rút ngắn thời gian xử lý sau khi bổ sung kiểm soát.',
          requirementIds: [requirementId],
        })
        .expect(201);
      replacementId = decisionDtoSchema.parse(proposed.body).id;
      for (const replacementDecisionId of [id, replacementId])
        await api()
          .post(`${base()}/${id}/supersede`)
          .set('Authorization', auth())
          .send({ expectedVersion: 3, replacementDecisionId })
          .expect(409);
      await api()
        .post(`${base()}/${replacementId}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 1 })
        .expect(201);
      const result = await api()
        .post(`${base()}/${id}/supersede`)
        .set('Authorization', auth())
        .send({ expectedVersion: 3, replacementDecisionId: replacementId })
        .expect(201);
      expect(decisionDtoSchema.parse(result.body)).toMatchObject({
        status: 'SUPERSEDED',
        version: 4,
        supersededById: replacementId,
      });
      await api()
        .post(`${base()}/${id}/supersede`)
        .set('Authorization', auth())
        .send({ expectedVersion: 4, replacementDecisionId: replacementId })
        .expect(409);
      await api()
        .delete(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(404);
    });

    it('persists supersession and complete histories across restart', async () => {
      await restart();
      const original = await api()
        .get(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(200);
      expect(decisionDtoSchema.parse(original.body)).toMatchObject({
        status: 'SUPERSEDED',
        version: 4,
        supersededById: replacementId,
      });
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(decisionVersionSchema.array().parse(history.body)).toHaveLength(4);
      const replacementHistory = await api()
        .get(`${base()}/${replacementId}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(
        decisionVersionSchema.array().parse(replacementHistory.body),
      ).toHaveLength(2);
    });
  });
}
