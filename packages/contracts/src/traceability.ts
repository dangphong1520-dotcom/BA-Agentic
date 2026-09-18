import { z } from "zod";
import { requirementStatusSchema } from "./requirements.js";

export const traceabilityItemSchema = z.object({
  requirementId: z.uuid(),
  title: z.string().min(1),
  status: requirementStatusSchema,
  version: z.number().int().positive(),
  evidenceCount: z.number().int().nonnegative(),
  sourceCount: z.number().int().nonnegative(),
  questionCount: z.number().int().nonnegative(),
  openQuestionCount: z.number().int().nonnegative(),
  businessRuleCount: z.number().int().nonnegative(),
  decisionCount: z.number().int().nonnegative(),
});
export type TraceabilityItem = z.infer<typeof traceabilityItemSchema>;
