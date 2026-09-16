import { z } from "zod";
export const sourceTypeSchema = z.enum([
  "MANUAL_INPUT",
  "MEETING",
  "DOCUMENT",
  "EMAIL",
  "CHAT",
]);
export const createSourceSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  type: sourceTypeSchema,
  content: z
    .string()
    .min(1)
    .max(20000)
    .refine((value) => value.trim().length > 0, "Content is required")
    .refine(
      (value) =>
        value.split("\n").length <= 200 &&
        value.split("\n").every((line) => line.length <= 4000),
      "Maximum 200 lines and 4000 characters per line",
    ),
});
export const sourceSegmentSchema = z.object({
  id: z.uuid(),
  sourceId: z.uuid(),
  projectId: z.uuid(),
  line: z.number().int().positive(),
  startOffset: z.number().int().nonnegative(),
  endOffset: z.number().int().nonnegative(),
  text: z.string(),
});
export const sourceDtoSchema = createSourceSchema.extend({
  id: z.uuid(),
  workspaceId: z.uuid(),
  projectId: z.uuid(),
  revision: z.literal(1),
  createdBy: z.uuid(),
  createdAt: z.iso.datetime(),
  segments: sourceSegmentSchema.array(),
});
export const linkEvidenceSchema = z.strictObject({
  segmentId: z.uuid(),
  expectedVersion: z.number().int().positive(),
});
export const evidenceDtoSchema = z.object({
  id: z.uuid(),
  requirementId: z.uuid(),
  requirementVersion: z.number().int().positive(),
  segmentId: z.uuid(),
  projectId: z.uuid(),
  createdBy: z.uuid(),
  createdAt: z.iso.datetime(),
  sourceTitle: z.string(),
  sourceRevision: z.literal(1),
  segment: sourceSegmentSchema,
});
export type CreateSource = z.infer<typeof createSourceSchema>;
export type LinkEvidence = z.infer<typeof linkEvidenceSchema>;
export type SourceDto = z.infer<typeof sourceDtoSchema>;
export type EvidenceDto = z.infer<typeof evidenceDtoSchema>;
