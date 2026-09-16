import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { questionDtoSchema, questionVersionSchema } from '@ba/contracts';
import { DatabaseService } from '../src/database/database.service.js';
export function questionChecks(
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
  describe('Governed clarification questions', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () =>
      `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}/questions`;
    const fields = {
      question: 'Ai xác nhận số tiền hoàn lại?',
      category: 'BUSINESS',
      priority: 'HIGH',
      blocking: true,
      stakeholder: 'Kế toán',
      requirementId: null,
    };
    let id: string;
    let linkedRequirement: string;
    it('rejects unauthenticated and forged metadata or invalid fields', async () => {
      await api().get(base()).expect(401);
      for (const invalid of [
        { question: ' ' },
        { question: 'x'.repeat(2001) },
        { category: 'OTHER' },
        { blocking: 'true' },
        { createdBy: context().userId },
        { status: 'CLOSED' },
        { answer: 'forged' },
      ])
        await api()
          .post(base())
          .set('Authorization', auth())
          .send({ ...fields, ...invalid })
          .expect(400);
    });
    it('creates an open question linked to a requirement and preserves its first version', async () => {
      const db = context().app.get(DatabaseService).db;
      const requirement = await db.requirement.findFirstOrThrow({
        where: { projectId: context().projectId },
      });
      linkedRequirement = requirement.id;
      const result = await api()
        .post(base())
        .set('Authorization', auth())
        .send({ ...fields, requirementId: linkedRequirement })
        .expect(201);
      const row = questionDtoSchema.parse(result.body);
      id = row.id;
      expect(row).toMatchObject({
        status: 'OPEN',
        answer: '',
        version: 1,
        createdBy: context().userId,
        requirementId: linkedRequirement,
      });
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(
        questionVersionSchema.array().parse(history.body)[0].snapshot,
      ).toEqual(row);
    });
    it('enforces tenant boundaries and rejects cross-project links at API and database', async () => {
      const c = context();
      const foreignBase = `/api/v1/workspaces/${c.foreignWorkspace}/projects/${c.foreignProject}/questions`;
      for (const suffix of ['', `/${id}`, `/${id}/versions`])
        await api()
          .get(foreignBase + suffix)
          .set('Authorization', auth())
          .expect(404);
      await api()
        .post(foreignBase)
        .set('Authorization', auth())
        .send(fields)
        .expect(404);
      await api()
        .patch(`${foreignBase}/${id}`)
        .set('Authorization', auth())
        .send({ ...fields, expectedVersion: 1, status: 'OPEN', answer: '' })
        .expect(404);
      const db = c.app.get(DatabaseService).db;
      const original = await db.requirement.findUniqueOrThrow({
        where: { id: linkedRequirement },
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
        .send({ ...fields, requirementId: foreign.id })
        .expect(404);
      await api()
        .patch(`${base()}/${id}`)
        .set('Authorization', auth())
        .send({
          ...fields,
          requirementId: foreign.id,
          expectedVersion: 1,
          status: 'OPEN',
          answer: '',
        })
        .expect(404);
      await expect(
        db.question.create({
          data: {
            ...fields,
            category: 'BUSINESS',
            priority: 'HIGH',
            workspaceId: c.workspaceId,
            projectId: c.projectId,
            createdBy: c.userId,
            requirementId: foreign.id,
          },
        }),
      ).rejects.toThrow();
    });
    it('requires an answer and an answered state before closure', async () => {
      for (const invalid of [
        { status: 'ANSWERED', answer: ' ' },
        { status: 'CLOSED', answer: 'Draft answer' },
      ])
        await api()
          .patch(`${base()}/${id}`)
          .set('Authorization', auth())
          .send({ ...fields, expectedVersion: 1, ...invalid })
          .expect(400);
    });
    it('allows only one concurrent edit and atomically records history', async () => {
      const results = await Promise.all(
        ['Trưởng phòng', 'Giám đốc'].map((answer) =>
          api()
            .patch(`${base()}/${id}`)
            .set('Authorization', auth())
            .send({
              ...fields,
              requirementId: linkedRequirement,
              answer,
              status: 'ANSWERED',
              expectedVersion: 1,
            }),
        ),
      );
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      const row = questionDtoSchema.parse(
        results.find((r) => r.status === 200)!.body,
      );
      expect(row.version).toBe(2);
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(history.body).toHaveLength(2);
      expect(history.body[0].snapshot).toEqual(row);
      expect(history.body[1].snapshot.answer).toBe('');
    });
    it('closes answered questions without changing requirement content and rejects later edits', async () => {
      const db = context().app.get(DatabaseService).db;
      const requirement = await db.requirement.findUniqueOrThrow({
        where: { id: linkedRequirement },
      });
      await api()
        .patch(`${base()}/${id}`)
        .set('Authorization', auth())
        .send({
          ...fields,
          requirementId: linkedRequirement,
          answer: 'Đã xác nhận với kế toán.',
          status: 'CLOSED',
          expectedVersion: 2,
        })
        .expect(200);
      await api()
        .patch(`${base()}/${id}`)
        .set('Authorization', auth())
        .send({ ...fields, answer: '', status: 'OPEN', expectedVersion: 3 })
        .expect(409);
      await api()
        .delete(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(404);
      expect(
        await db.requirement.findUniqueOrThrow({
          where: { id: linkedRequirement },
        }),
      ).toEqual(requirement);
    });
    it('persists closed questions and full history across application restart', async () => {
      await restart();
      const row = await api()
        .get(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(200);
      expect(questionDtoSchema.parse(row.body)).toMatchObject({
        version: 3,
        status: 'CLOSED',
      });
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(questionVersionSchema.array().parse(history.body)).toHaveLength(3);
    });
  });
}
