import { z } from "zod";

export const businessRulePrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);
export const businessRuleStatusSchema = z.enum([
  "DRAFT",
  "APPROVED",
  "SUPERSEDED",
]);
const requirementIdsSchema = z
  .array(z.uuid())
  .max(100)
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate requirement");
export const businessRuleFieldsSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(4000),
  priority: businessRulePrioritySchema,
  requirementIds: requirementIdsSchema,
});
export const createBusinessRuleSchema = businessRuleFieldsSchema;
export const updateBusinessRuleSchema = businessRuleFieldsSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const approveBusinessRuleSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
});
export const businessRuleDtoSchema = businessRuleFieldsSchema.extend({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  code: z.string().regex(/^BR-[0-9A-F]{8}$/),
  status: businessRuleStatusSchema,
  version: z.number().int().positive(),
  createdBy: z.uuid(),
  approvedBy: z.uuid().nullable(),
  approvedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const businessRuleVersionSchema = z.object({
  businessRuleId: z.uuid(),
  version: z.number().int().positive(),
  changedBy: z.uuid(),
  createdAt: z.iso.datetime(),
  snapshot: businessRuleDtoSchema,
});

export type CreateBusinessRule = z.infer<typeof createBusinessRuleSchema>;
export type UpdateBusinessRule = z.infer<typeof updateBusinessRuleSchema>;
export type BusinessRuleDto = z.infer<typeof businessRuleDtoSchema>;
