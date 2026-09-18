import { z } from "zod";

export const requirementTypeSchema = z.enum([
  "BUSINESS",
  "FUNCTIONAL",
  "NON_FUNCTIONAL",
]);
export const requirementPrioritySchema = z.enum([
  "UNDEFINED",
  "MUST",
  "SHOULD",
  "COULD",
  "WONT",
]);
export const requirementStatusSchema = z.enum([
  "DRAFT",
  "CLARIFICATION_REQUIRED",
  "READY_FOR_REVIEW",
  "APPROVED",
  "BASELINED",
]);
const text = z.string().trim().max(4000);
export const requirementFieldsSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  type: requirementTypeSchema,
  priority: requirementPrioritySchema,
  description: text,
  businessGoal: text,
  actor: text,
  preconditions: text,
  mainFlow: text,
  exceptionFlow: text,
  acceptanceCriteria: text,
  sourceNote: text,
});
export const createRequirementSchema = requirementFieldsSchema;
export const updateRequirementSchema = requirementFieldsSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const requirementTransitionSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
});
export const requirementDtoSchema = requirementFieldsSchema.extend({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  status: requirementStatusSchema,
  version: z.number().int().positive(),
  createdBy: z.uuid(),
  approvedBy: z.uuid().nullable().default(null),
  approvedAt: z.iso.datetime().nullable().default(null),
  baselinedBy: z.uuid().nullable().default(null),
  baselinedAt: z.iso.datetime().nullable().default(null),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const requirementVersionSchema = z.object({
  version: z.number().int().positive(),
  changedBy: z.uuid(),
  createdAt: z.iso.datetime(),
  snapshot: requirementDtoSchema,
});
export const requirementReadinessStatusSchema = z.enum([
  "READY",
  "CONDITIONAL",
  "NOT_READY",
]);
export const requirementReadinessCheckKeySchema = z.enum([
  "DESCRIPTION",
  "BUSINESS_GOAL",
  "ACTOR",
  "MAIN_FLOW",
  "ACCEPTANCE_CRITERIA",
  "SOURCE_EVIDENCE",
  "BLOCKING_QUESTIONS",
]);
export const requirementReadinessCheckSchema = z.object({
  key: requirementReadinessCheckKeySchema,
  passed: z.boolean(),
  hard: z.boolean(),
});
export const requirementReadinessSchema = z.object({
  requirementId: z.uuid(),
  requirementVersion: z.number().int().positive(),
  status: requirementReadinessStatusSchema,
  evidenceCount: z.number().int().nonnegative(),
  unresolvedBlockingQuestionCount: z.number().int().nonnegative(),
  checks: z.array(requirementReadinessCheckSchema),
});
export type CreateRequirement = z.infer<typeof createRequirementSchema>;
export type UpdateRequirement = z.infer<typeof updateRequirementSchema>;
export type RequirementDto = z.infer<typeof requirementDtoSchema>;
export type RequirementReadiness = z.infer<
  typeof requirementReadinessSchema
>;
