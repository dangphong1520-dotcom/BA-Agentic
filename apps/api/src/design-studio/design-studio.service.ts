import { ConflictException, Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { designArtifactSchema, designContentSchema, designPreviewSchema, requirementDtoSchema, type DesignArtifact, type DesignPreview } from '@ba/contracts';
import { RequirementService } from '../requirements/requirement.service.js';
import { DesignStudioGateway } from './design-studio.gateway.js';
import { DesignStudioRepository } from './design-studio.repository.js';

@Injectable()
export class DesignStudioService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer?: NodeJS.Timeout;
  private automationRunning = false;
  constructor(@Inject(RequirementService) private readonly requirements: RequirementService, @Inject(DesignStudioGateway) private readonly gateway: DesignStudioGateway, @Inject(DesignStudioRepository) private readonly repository: DesignStudioRepository) {}
  private dto(row: NonNullable<Awaited<ReturnType<DesignStudioRepository['get']>>>): DesignArtifact {
    const content = designContentSchema.parse(row.result);
    return designArtifactSchema.parse({ ...content, id: row.id, requirementId: row.requirementId, requirementVersion: row.requirementVersion,
      artifactVersion: row.artifactVersion, revision: row.revision, status: row.status, trigger: row.trigger,
      generatorProfile: row.generatorProfile, classification: 'PROPOSAL', generatedAt: row.createdAt.toISOString(),
      instruction: row.instruction, reviewedAt: row.reviewedAt?.toISOString() ?? null, errorMessage: row.errorMessage });
  }
  async preview(user: string, workspace: string, project: string, id: string): Promise<DesignPreview> {
    const requirement = await this.requirements.get(user, workspace, project, id); const generated = await this.gateway.generate(requirement);
    return designPreviewSchema.parse({ ...generated.content, requirementId: requirement.id, requirementVersion: requirement.version, generatorProfile: generated.profile, classification: 'PROPOSAL', generatedAt: new Date().toISOString() });
  }
  async create(user: string, workspace: string, project: string, id: string, instruction = '', trigger: 'MANUAL' | 'REQUIREMENT_CHANGED' = 'MANUAL') {
    const requirement = await this.requirements.get(user, workspace, project, id); const generated = await this.gateway.generate(requirement, instruction);
    return this.dto(await this.repository.create(user, workspace, project, id, requirement.version, trigger, generated.profile, generated.content, instruction));
  }
  async list(user: string, workspace: string, project: string, id: string) {
    await this.requirements.get(user, workspace, project, id);
    return (await this.repository.list(user, workspace, project, id)).map((row) => this.dto(row));
  }
  private async review(user: string, workspace: string, project: string, requirementId: string, artifactId: string, expectedRevision: number, status: 'ACCEPTED' | 'REJECTED') {
    const [updated] = await this.repository.review(user, workspace, project, requirementId, artifactId, expectedRevision, status);
    if (!updated) throw new ConflictException('Design proposal was already changed or reviewed'); return this.dto(updated);
  }
  accept(...args: [string, string, string, string, string, number]) { return this.review(...args, 'ACCEPTED'); }
  reject(...args: [string, string, string, string, string, number]) { return this.review(...args, 'REJECTED'); }
  async runAutomation() {
    if (this.automationRunning) return; this.automationRunning = true;
    try { for (const row of await this.repository.outdated()) {
      const latest = row.designArtifacts[0]; if (!latest || latest.requirementVersion >= row.version) continue;
      const { designArtifacts: _designArtifacts, ...requirementRow } = row;
      const requirement = requirementDtoSchema.parse({ ...requirementRow, approvedAt: row.approvedAt?.toISOString() ?? null, baselinedAt: row.baselinedAt?.toISOString() ?? null, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
      const generated = await this.gateway.generate(requirement);
      await this.repository.create(row.createdBy, row.workspaceId, row.projectId, row.id, row.version, 'REQUIREMENT_CHANGED', generated.profile, generated.content);
    } } finally { this.automationRunning = false; }
  }
  onApplicationBootstrap() { if (process.env.DESIGN_AUTOMATION_ENABLED !== 'false') { this.timer = setInterval(() => void this.runAutomation(), 15_000); this.timer.unref(); } }
  onApplicationShutdown() { if (this.timer) clearInterval(this.timer); }
}
