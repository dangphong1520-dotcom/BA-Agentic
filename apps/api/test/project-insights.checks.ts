import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import {
  findingRegisterItemSchema,
  designArtifactSchema,
  designPreviewSchema,
  requirementDtoSchema,
  readinessPortfolioSchema,
  traceabilityItemSchema,
} from '@ba/contracts';
import { DesignStudioService } from '../src/design-studio/design-studio.service.js';

export function projectInsightChecks(context: () => {
  app: INestApplication<App>;
  token: string;
  workspaceId: string;
  projectId: string;
  foreignWorkspace: string;
  foreignProject: string;
}) {
  describe('Project insight modules', () => {
    const api = () => request(context().app.getHttpServer());
    const auth = () => `Bearer ${context().token}`;
    const base = () => `/api/v1/workspaces/${context().workspaceId}/projects/${context().projectId}`;

    it('lists schema-valid analysis findings with source context', async () => {
      const response = await api().get(`${base()}/findings`).set('Authorization', auth()).expect(200);
      const rows = findingRegisterItemSchema.array().parse(response.body);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].sourceTitle).toBeTruthy();
    });

    it('summarizes requirement trace relationships', async () => {
      const response = await api().get(`${base()}/traceability`).set('Authorization', auth()).expect(200);
      const rows = traceabilityItemSchema.array().parse(response.body);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.some((row) => row.evidenceCount > 0)).toBe(true);
    });

    it('returns a consistent project readiness portfolio', async () => {
      const response = await api().get(`${base()}/readiness-portfolio`).set('Authorization', auth()).expect(200);
      const portfolio = readinessPortfolioSchema.parse(response.body);
      expect(portfolio.total).toBe(portfolio.items.length);
      expect(portfolio.ready + portfolio.conditional + portfolio.notReady).toBe(portfolio.total);
    });

    it('generates governed flow, BPMN, and prototype proposals from a requirement', async () => {
      const portfolioResponse = await api().get(`${base()}/readiness-portfolio`).set('Authorization', auth()).expect(200);
      const portfolio = readinessPortfolioSchema.parse(portfolioResponse.body);
      const requirement = portfolio.items[0];
      expect(requirement).toBeDefined();
      const response = await api().get(`${base()}/requirements/${requirement.requirementId}/design/preview`).set('Authorization', auth()).expect(200);
      const preview = designPreviewSchema.parse(response.body);
      expect(preview).toMatchObject({ classification: 'PROPOSAL', requirementVersion: requirement.version });
      expect(preview.flow.nodes.length).toBeGreaterThanOrEqual(2);
      expect(preview.bpmn.lanes.length).toBeGreaterThanOrEqual(1);
      expect(preview.prototype.screens.length).toBeGreaterThanOrEqual(1);
    });

    it('versions and human-reviews a persisted design proposal', async () => {
      const portfolio = readinessPortfolioSchema.parse((await api().get(`${base()}/readiness-portfolio`).set('Authorization', auth()).expect(200)).body);
      const requirement = portfolio.items[0];
      const created = designArtifactSchema.parse((await api().post(`${base()}/requirements/${requirement.requirementId}/design/artifacts`).set('Authorization', auth()).send({}).expect(201)).body);
      expect(created).toMatchObject({ status: 'PENDING_REVIEW', artifactVersion: 1, trigger: 'MANUAL' });
      const accepted = designArtifactSchema.parse((await api().post(`${base()}/requirements/${requirement.requirementId}/design/artifacts/${created.id}/accept`).set('Authorization', auth()).send({ expectedRevision: created.revision }).expect(201)).body);
      expect(accepted.status).toBe('ACCEPTED');
      await api().post(`${base()}/requirements/${requirement.requirementId}/design/artifacts/${created.id}/reject`).set('Authorization', auth()).send({ expectedRevision: accepted.revision }).expect(409);
      const list = designArtifactSchema.array().parse((await api().get(`${base()}/requirements/${requirement.requirementId}/design/artifacts`).set('Authorization', auth()).expect(200)).body);
      expect(list[0].status).toBe('ACCEPTED');
    });

    it('regenerates design and expires a pending proposal after requirement changes', async () => {
      const portfolio = readinessPortfolioSchema.parse((await api().get(`${base()}/readiness-portfolio`).set('Authorization', auth()).expect(200)).body);
      const requirementId = portfolio.items[0].requirementId;
      const current = requirementDtoSchema.parse((await api().get(`${base()}/requirements/${requirementId}`).set('Authorization', auth()).expect(200)).body);
      const fields = { title: `${current.title} automation 1`, type: current.type, priority: current.priority, description: current.description, businessGoal: current.businessGoal, actor: current.actor, preconditions: current.preconditions, mainFlow: current.mainFlow, exceptionFlow: current.exceptionFlow, acceptanceCriteria: current.acceptanceCriteria, sourceNote: current.sourceNote };
      const firstUpdate = requirementDtoSchema.parse((await api().patch(`${base()}/requirements/${requirementId}`).set('Authorization', auth()).send({ ...fields, expectedVersion: current.version }).expect(200)).body);
      await context().app.get(DesignStudioService).runAutomation();
      const pending = designArtifactSchema.array().parse((await api().get(`${base()}/requirements/${requirementId}/design/artifacts`).set('Authorization', auth()).expect(200)).body);
      expect(pending[0]).toMatchObject({ status: 'PENDING_REVIEW', trigger: 'REQUIREMENT_CHANGED', requirementVersion: firstUpdate.version });
      await api().patch(`${base()}/requirements/${requirementId}`).set('Authorization', auth()).send({ ...fields, title: `${current.title} automation 2`, expectedVersion: firstUpdate.version }).expect(200);
      await context().app.get(DesignStudioService).runAutomation();
      const regenerated = designArtifactSchema.array().parse((await api().get(`${base()}/requirements/${requirementId}/design/artifacts`).set('Authorization', auth()).expect(200)).body);
      expect(regenerated[0]).toMatchObject({ status: 'PENDING_REVIEW', trigger: 'REQUIREMENT_CHANGED' });
      expect(regenerated[1].status).toBe('STALE');
    });

    it.each(['findings', 'traceability', 'readiness-portfolio'])('hides %s from a foreign project scope', async (path) => {
      await api()
        .get(`/api/v1/workspaces/${context().foreignWorkspace}/projects/${context().foreignProject}/${path}`)
        .set('Authorization', auth())
        .expect(404);
    });
  });
}
