import { z } from "zod";
export const documentFormatSchema = z.enum(["BRD", "PRD", "SRS"]);
export const documentPreviewSchema = z.object({
  format: documentFormatSchema, classification: z.literal("PROPOSAL"), generatorProfile: z.string().min(1), generatedAt: z.iso.datetime(), title: z.string().min(1),
  requirementVersions: z.array(z.object({ id: z.uuid(), version: z.number().int().positive() })),
  sections: z.array(z.object({ heading: z.string().min(1), content: z.string() })).min(1),
});
export type DocumentFormat = z.infer<typeof documentFormatSchema>;
export type DocumentPreview = z.infer<typeof documentPreviewSchema>;
