import { z } from "zod";
export const questionCategorySchema = z.enum([
  "BUSINESS",
  "PROCESS",
  "DATA",
  "RULE",
  "SYSTEM",
  "TECHNICAL",
  "UI_UX",
  "EXCEPTION",
  "SECURITY",
  "DEPENDENCY",
]);
export const questionPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const questionStatusSchema = z.enum(["OPEN", "ANSWERED", "CLOSED"]);
export const questionFieldsSchema = z.strictObject({
  question: z.string().trim().min(1).max(2000),
  category: questionCategorySchema,
  priority: questionPrioritySchema,
  blocking: z.boolean(),
  stakeholder: z.string().trim().max(120),
  requirementId: z.uuid().nullable(),
});
export const createQuestionSchema = questionFieldsSchema;
export const updateQuestionSchema = questionFieldsSchema
  .extend({
    expectedVersion: z.number().int().positive(),
    answer: z.string().trim().max(4000),
    status: questionStatusSchema,
  })
  .refine(
    (v) => v.status === "OPEN" || v.answer.length > 0,
    "Answered and closed questions require an answer",
  );
export const questionDtoSchema = questionFieldsSchema.extend({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  answer: z.string(),
  status: questionStatusSchema,
  version: z.number().int().positive(),
  createdBy: z.uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export const questionVersionSchema = z.object({
  questionId: z.uuid(),
  version: z.number().int().positive(),
  changedBy: z.uuid(),
  createdAt: z.iso.datetime(),
  snapshot: questionDtoSchema,
});
export type CreateQuestion = z.infer<typeof createQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type QuestionDto = z.infer<typeof questionDtoSchema>;
