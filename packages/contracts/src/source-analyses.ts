import { z } from "zod";
import { requirementFieldsSchema } from "./requirements.js";

export const knowledgeClassificationSchema = z.enum([
  "FACT",
  "INFERENCE",
  "ASSUMPTION",
  "PROPOSAL",
  "OPEN_QUESTION",
]);
export const analysisFindingTypeSchema = z.enum([
  "MISSING_INFORMATION",
  "AMBIGUITY",
  "CONFLICT",
  "DEPENDENCY",
  "QUALITY_ISSUE",
  "TRACEABILITY_GAP",
  "RECOMMENDATION",
]);
const evidenceIds = z.array(z.uuid()).max(20);
const classified = z.object({
  classification: knowledgeClassificationSchema,
  evidenceSegmentIds: evidenceIds,
  confidence: z.number().min(0).max(1),
});
export const sourceAnalysisResultSchema = z.strictObject({
  requirement: requirementFieldsSchema.extend(classified.shape),
  findings: z
    .array(
      z.strictObject({
        type: analysisFindingTypeSchema,
        description: z.string().trim().min(1).max(2000),
        ...classified.shape,
      }),
    )
    .max(50),
  questions: z
    .array(
      z.strictObject({
        question: z.string().trim().min(1).max(2000),
        reason: z.string().trim().min(1).max(2000),
        classification: z.literal("OPEN_QUESTION"),
        evidenceSegmentIds: evidenceIds,
      }),
    )
    .max(50),
});
export const sourceAnalysisStatusSchema = z.enum([
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);
export const sourceAnalysisReviewStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);
export const updateSourceProposalSchema = requirementFieldsSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const sourceProposalTransitionSchema = z.strictObject({
  expectedVersion: z.number().int().positive(),
});
export const sourceAnalysisDtoSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  sourceId: z.uuid(),
  sourceRevision: z.number().int().positive(),
  status: sourceAnalysisStatusSchema,
  version: z.number().int().positive(),
  reviewStatus: sourceAnalysisReviewStatusSchema,
  reviewedBy: z.uuid().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
  acceptedRequirementId: z.uuid().nullable(),
  schemaVersion: z.literal(1),
  modelProfile: z.string().min(1).max(80),
  requestedBy: z.uuid(),
  result: sourceAnalysisResultSchema.nullable(),
  errorCode: z.string().max(80).nullable(),
  errorMessage: z.string().max(500).nullable(),
  createdAt: z.iso.datetime(),
  completedAt: z.iso.datetime().nullable(),
});
export type SourceAnalysisResult = z.infer<typeof sourceAnalysisResultSchema>;
export type SourceAnalysisDto = z.infer<typeof sourceAnalysisDtoSchema>;
export type UpdateSourceProposal = z.infer<typeof updateSourceProposalSchema>;
