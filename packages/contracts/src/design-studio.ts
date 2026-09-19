import { z } from "zod";

const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["START", "ACTION", "DECISION", "END"]),
});
export const designContentSchema = z.object({
  flow: z.object({ title: z.string().min(1), nodes: z.array(nodeSchema).min(2) }),
  bpmn: z.object({
    title: z.string().min(1),
    lanes: z.array(z.object({ name: z.string().min(1), activities: z.array(z.string().min(1)) })).min(1),
  }),
  prototype: z.object({
    title: z.string().min(1),
    screens: z.array(z.object({ name: z.string().min(1), purpose: z.string().min(1), elements: z.array(z.string().min(1)) })).min(1),
  }),
});
export const designPreviewSchema = designContentSchema.extend({
  requirementId: z.uuid(),
  requirementVersion: z.number().int().positive(),
  generatorProfile: z.string().min(1),
  classification: z.literal("PROPOSAL"),
  generatedAt: z.iso.datetime(),
});
export const designArtifactStatusSchema = z.enum(["PENDING_REVIEW", "ACCEPTED", "REJECTED", "STALE", "FAILED"]);
export const designGenerationTriggerSchema = z.enum(["MANUAL", "REQUIREMENT_CHANGED"]);
export const designArtifactSchema = designPreviewSchema.extend({
  id: z.uuid(), artifactVersion: z.number().int().positive(), revision: z.number().int().positive(),
  status: designArtifactStatusSchema, trigger: designGenerationTriggerSchema,
  reviewedAt: z.iso.datetime().nullable(), errorMessage: z.string().nullable(),
});
export const designReviewSchema = z.object({ expectedRevision: z.number().int().positive() });
export type DesignContent = z.infer<typeof designContentSchema>;
export type DesignPreview = z.infer<typeof designPreviewSchema>;
export type DesignArtifact = z.infer<typeof designArtifactSchema>;
