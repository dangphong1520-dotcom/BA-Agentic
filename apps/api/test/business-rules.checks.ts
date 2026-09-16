import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import {
  businessRuleDtoSchema,
  businessRuleVersionSchema,
} from '@ba/contracts';
import { DatabaseService } from '../src/database/database.service.js';

export function businessRuleChecks(
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
  describe('Governed business rules', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () =>
      `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}/business-rules`;
    const fields = {
      title: 'Giới hạn hoàn tiền',
      description: 'Số tiền hoàn lại không vượt quá giá trị đã thanh toán.',
      priority: 'HIGH',
      requirementIds: [] as string[],
    };
    let id: string;
    let requirementId: string;

    it('rejects unauthenticated, invalid and caller-controlled governance fields', async () => {
      await api().get(base()).expect(401);
      for (const invalid of [
        { title: ' ' },
        { description: ' ' },
        { priority: 'URGENT' },
        { status: 'APPROVED' },
        { code: 'BR-FORGED00' },
        { createdBy: context().userId },
        { approvedBy: context().userId },
      ])
        await api()
          .post(base())
          .set('Authorization', auth())
          .send({ ...fields, ...invalid })
          .expect(400);
    });

    it('creates a linked draft with server code and its first snapshot', async () => {
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
      const row = businessRuleDtoSchema.parse(result.body);
      id = row.id;
      expect(row).toMatchObject({
        status: 'DRAFT',
        version: 1,
        createdBy: context().userId,
        approvedBy: null,
        approvedAt: null,
        requirementIds: [requirementId],
      });
      expect(row.code).toMatch(/^BR-[0-9A-F]{8}$/);
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(
        businessRuleVersionSchema.array().parse(history.body)[0].snapshot,
      ).toEqual(row);
    });

    it('enforces access and cross-project traceability boundaries', async () => {
      const c = context();
      const foreignBase = `/api/v1/workspaces/${c.foreignWorkspace}/projects/${c.foreignProject}/business-rules`;
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
        db.businessRuleRequirement.create({
          data: {
            projectId: c.projectId,
            businessRuleId: id,
            requirementId: foreign.id,
          },
        }),
      ).rejects.toThrow();
    });

    it('allows one competing edit and records exactly one new version', async () => {
      const results = await Promise.all(
        ['Giới hạn hoàn tiền đã xác nhận', 'Giới hạn hoàn tiền thay thế'].map(
          (title) =>
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
      const row = businessRuleDtoSchema.parse(
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

    it('requires a distinct human approval command and locks approved knowledge', async () => {
      const db = context().app.get(DatabaseService).db;
      const requirementBefore = await db.requirement.findUniqueOrThrow({
        where: { id: requirementId },
      });
      await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 2, approvedBy: context().userId })
        .expect(400);
      const result = await api()
        .post(`${base()}/${id}/approve`)
        .set('Authorization', auth())
        .send({ expectedVersion: 2 })
        .expect(201);
      const row = businessRuleDtoSchema.parse(result.body);
      expect(row).toMatchObject({
        status: 'APPROVED',
        version: 3,
        approvedBy: context().userId,
        requirementIds: [requirementId],
      });
      expect(row.approvedAt).not.toBeNull();
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
      await api()
        .delete(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(404);
      expect(
        await db.requirement.findUniqueOrThrow({
          where: { id: requirementId },
        }),
      ).toEqual(requirementBefore);
    });

    it('persists approval and complete history across application restart', async () => {
      await restart();
      const row = await api()
        .get(`${base()}/${id}`)
        .set('Authorization', auth())
        .expect(200);
      expect(businessRuleDtoSchema.parse(row.body)).toMatchObject({
        status: 'APPROVED',
        version: 3,
      });
      const history = await api()
        .get(`${base()}/${id}/versions`)
        .set('Authorization', auth())
        .expect(200);
      expect(
        businessRuleVersionSchema.array().parse(history.body),
      ).toHaveLength(3);
    });
  });
}
