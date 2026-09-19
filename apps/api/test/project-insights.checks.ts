import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types.js';
import request from 'supertest';
import {
  findingRegisterItemSchema,
  designPreviewSchema,
  readinessPortfolioSchema,
  traceabilityItemSchema,
} from '@ba/contracts';

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
      const response = await api().get(`${base()}/requirements/${requirement.requirementId}/design-preview`).set('Authorization', auth()).expect(200);
      const preview = designPreviewSchema.parse(response.body);
      expect(preview).toMatchObject({ classification: 'PROPOSAL', requirementVersion: requirement.version });
      expect(preview.flow.nodes.length).toBeGreaterThanOrEqual(2);
      expect(preview.bpmn.lanes.length).toBeGreaterThanOrEqual(1);
      expect(preview.prototype.screens.length).toBeGreaterThanOrEqual(1);
    });

    it.each(['findings', 'traceability', 'readiness-portfolio'])('hides %s from a foreign project scope', async (path) => {
      await api()
        .get(`/api/v1/workspaces/${context().foreignWorkspace}/projects/${context().foreignProject}/${path}`)
        .set('Authorization', auth())
        .expect(404);
    });
  });
}
