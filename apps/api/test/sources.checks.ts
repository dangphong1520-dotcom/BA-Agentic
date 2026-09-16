import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import { DatabaseService } from '../src/database/database.service.js';
import {
  sourceDtoSchema,
  requirementDtoSchema,
  evidenceDtoSchema,
} from '@ba/contracts';
export function sourceChecks(
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
  describe('Sources and version-scoped references', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () =>
      `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}`;
    let sourceId: string;
    let segmentId: string;
    let requirementId: string;
    const content = '  Original text 😀\r\n\nSecond line with spaces  ';
    const draft = {
      title: 'Source-linked requirement',
      type: 'FUNCTIONAL',
      priority: 'UNDEFINED',
      description: '',
      businessGoal: '',
      actor: '',
      preconditions: '',
      mainFlow: '',
      exceptionFlow: '',
      acceptanceCriteria: '',
      sourceNote: '',
    };
    const evidence = () => `${base()}/requirements/${requirementId}/evidence`;
    it('requires authentication and bounds input without accepting caller identity', async () => {
      await api().get(`${base()}/sources`).expect(401);
      for (const invalid of [
        { content: ' ' },
        { content: 'a'.repeat(4001) },
        { content: 'a\n'.repeat(201) },
        { createdBy: context().userId },
        { revision: 2 },
      ]) {
        await api()
          .post(`${base()}/sources`)
          .set('Authorization', auth())
          .send({
            title: 'Source',
            type: 'MANUAL_INPUT',
            content: 'Valid',
            ...invalid,
          })
          .expect(400);
      }
    });
    it('preserves exact source text and stable line offsets', async () => {
      const response = await api()
        .post(`${base()}/sources`)
        .set('Authorization', auth())
        .send({ title: 'Original source', type: 'MEETING', content })
        .expect(201);
      const source = sourceDtoSchema.parse(response.body);
      sourceId = source.id;
      segmentId = source.segments[0].id;
      expect(source.content).toBe(content);
      expect(source.segments.map((row) => row.line)).toEqual([1, 3]);
      for (const segment of source.segments)
        expect(content.slice(segment.startOffset, segment.endOffset)).toBe(
          segment.text,
        );
      expect(source.createdBy).toBe(context().userId);
      const result = await api()
        .post(`${base()}/requirements`)
        .set('Authorization', auth())
        .send(draft)
        .expect(201);
      requirementId = requirementDtoSchema.parse(result.body).id;
    });
    it('links idempotently without changing draft content, timestamp or version', async () => {
      const prisma = context().app.get(DatabaseService).db;
      const before = await prisma.requirement.findUniqueOrThrow({
        where: { id: requirementId },
      });
      const responses = await Promise.all(
        [1, 2].map(() =>
          api()
            .post(evidence())
            .set('Authorization', auth())
            .send({ segmentId, expectedVersion: 1 }),
        ),
      );
      expect(responses.map((row) => row.status)).toEqual([201, 201]);
      expect(evidenceDtoSchema.parse(responses[0].body).id).toBe(
        evidenceDtoSchema.parse(responses[1].body).id,
      );
      expect(
        await prisma.requirement.findUniqueOrThrow({
          where: { id: requirementId },
        }),
      ).toEqual(before);
      expect(
        await prisma.requirementEvidence.count({ where: { requirementId } }),
      ).toBe(1);
    });
    it('rejects foreign and cross-project references and history access', async () => {
      const c = context();
      const foreignBase = `/api/v1/workspaces/${c.foreignWorkspace}/projects/${c.foreignProject}`;
      await api()
        .get(`${foreignBase}/sources`)
        .set('Authorization', auth())
        .expect(404);
      await api()
        .post(`${foreignBase}/sources`)
        .set('Authorization', auth())
        .send({ title: 'No', type: 'EMAIL', content: 'No' })
        .expect(404);
      const peer = await api()
        .post(`/api/v1/workspaces/${c.workspaceId}/projects`)
        .set('Authorization', auth())
        .send({ name: 'Source peer' })
        .expect(201);
      const peerBase = `/api/v1/workspaces/${c.workspaceId}/projects/${peer.body.id}`;
      await api()
        .get(`${peerBase}/sources/${sourceId}`)
        .set('Authorization', auth())
        .expect(404);
      await api()
        .get(`${peerBase}/requirements/${requirementId}/evidence`)
        .set('Authorization', auth())
        .expect(404);
      const peerSource = await api()
        .post(`${peerBase}/sources`)
        .set('Authorization', auth())
        .send({ title: 'Peer', type: 'CHAT', content: 'Peer' })
        .expect(201);
      const peerSegment = sourceDtoSchema.parse(peerSource.body).segments[0].id;
      await api()
        .post(evidence())
        .set('Authorization', auth())
        .send({ segmentId: peerSegment, expectedVersion: 1 })
        .expect(404);
      await expect(
        c.app.get(DatabaseService).db.requirementEvidence.create({
          data: {
            projectId: c.projectId,
            requirementId,
            requirementVersion: 1,
            segmentId: peerSegment,
            createdBy: c.userId,
          },
        }),
      ).rejects.toThrow();
    });
    it('rejects status spoofing, preserves source against edits and deletion', async () => {
      await api()
        .post(evidence())
        .set('Authorization', auth())
        .send({ segmentId, expectedVersion: 1, confirmed: true })
        .expect(400);
      await api()
        .patch(`${base()}/sources/${sourceId}`)
        .set('Authorization', auth())
        .send({ content: 'Changed' })
        .expect(404);
      await api()
        .delete(`${base()}/sources/${sourceId}`)
        .set('Authorization', auth())
        .expect(404);
      await expect(
        context()
          .app.get(DatabaseService)
          .db.sourceSegment.delete({ where: { id: segmentId } }),
      ).rejects.toThrow();
    });
    it('keeps references on their historical version and rejects stale attachment', async () => {
      await api()
        .patch(`${base()}/requirements/${requirementId}`)
        .set('Authorization', auth())
        .send({ ...draft, title: 'Version 2', expectedVersion: 1 })
        .expect(200);
      await api()
        .post(evidence())
        .set('Authorization', auth())
        .send({ segmentId, expectedVersion: 1 })
        .expect(409);
      const old = await api()
        .get(evidence())
        .set('Authorization', auth())
        .expect(200);
      expect(old.body).toHaveLength(1);
      expect(old.body[0].requirementVersion).toBe(1);
      await api()
        .post(evidence())
        .set('Authorization', auth())
        .send({ segmentId, expectedVersion: 2 })
        .expect(201);
      const current = await api()
        .get(evidence())
        .set('Authorization', auth())
        .expect(200);
      expect(
        current.body.map(
          (row: { requirementVersion: number }) => row.requirementVersion,
        ),
      ).toEqual([2, 1]);
    });
    it('serializes reference attachment against a concurrent content update', async () => {
      const created = await api()
        .post(`${base()}/requirements`)
        .set('Authorization', auth())
        .send(draft)
        .expect(201);
      const id = requirementDtoSchema.parse(created.body).id;
      const [link, update] = await Promise.all([
        api()
          .post(`${base()}/requirements/${id}/evidence`)
          .set('Authorization', auth())
          .send({ segmentId, expectedVersion: 1 }),
        api()
          .patch(`${base()}/requirements/${id}`)
          .set('Authorization', auth())
          .send({ ...draft, title: 'Concurrent edit', expectedVersion: 1 }),
      ]);
      expect(update.status).toBe(200);
      expect([201, 409]).toContain(link.status);
      const rows = await api()
        .get(`${base()}/requirements/${id}/evidence`)
        .set('Authorization', auth())
        .expect(200);
      expect(rows.body).toHaveLength(link.status === 201 ? 1 : 0);
      if (rows.body.length) expect(rows.body[0].requirementVersion).toBe(1);
    });
    it('persists source, exact excerpts and references after restart', async () => {
      await restart();
      const response = await api()
        .get(`${base()}/sources/${sourceId}`)
        .set('Authorization', auth())
        .expect(200);
      expect(sourceDtoSchema.parse(response.body).content).toBe(content);
      const linked = await api()
        .get(evidence())
        .set('Authorization', auth())
        .expect(200);
      expect(linked.body).toHaveLength(2);
      expect(evidenceDtoSchema.parse(linked.body[0]).segment.text).toBe(
        content.split('\n')[0],
      );
    });
  });
}
