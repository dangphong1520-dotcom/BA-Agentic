import { z } from "zod";

export const decisionStatusSchema = z.enum([
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "SUPERSEDED",
  "DEPRECATED",
]);

const requirementIdsSchema = z
  .array(z.uuid())
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate requirement");

export const decisionFieldsSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  rationale: z.string().trim().min(1).max(4000),
  requirementIds: requirementIdsSchema,
});

export const createDecisionSchema = decisionFieldsSchema;
export const updateDecisionSchema = decisionFieldsSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const approveDecisionSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
});
export const supersedeDecisionSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
  replacementDecisionId: z.uuid(),
});

export const decisionDtoSchema = decisionFieldsSchema.extend({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  code: z.string().regex(/^DEC-[0-9A-F]{8}$/),
  status: decisionStatusSchema,
  version: z.number().int().positive(),
  createdBy: z.uuid(),
  decidedBy: z.uuid().nullable(),
  decisionDate: z.iso.datetime().nullable(),
  supersededById: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const decisionVersionSchema = z.object({
  decisionId: z.uuid(),
  version: z.number().int().positive(),
  changedBy: z.uuid(),
  createdAt: z.iso.datetime(),
  snapshot: decisionDtoSchema,
});

export type CreateDecision = z.infer<typeof createDecisionSchema>;
export type UpdateDecision = z.infer<typeof updateDecisionSchema>;
export type DecisionDto = z.infer<typeof decisionDtoSchema>;
