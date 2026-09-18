import { z } from "zod";
import {
  analysisFindingTypeSchema,
  knowledgeClassificationSchema,
  sourceAnalysisReviewStatusSchema,
} from "./source-analyses.js";

export const findingRegisterItemSchema = z.object({
  id: z.string().min(1),
  analysisId: z.uuid(),
  sourceId: z.uuid(),
  sourceTitle: z.string().min(1),
  type: analysisFindingTypeSchema,
  classification: knowledgeClassificationSchema,
  description: z.string().min(1),
  confidence: z.number().min(0).max(1),
  evidenceCount: z.number().int().nonnegative(),
  reviewStatus: sourceAnalysisReviewStatusSchema,
  createdAt: z.iso.datetime(),
});
export type FindingRegisterItem = z.infer<typeof findingRegisterItemSchema>;
