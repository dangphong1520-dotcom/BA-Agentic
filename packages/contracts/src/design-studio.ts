import { z } from "zod";

const nodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["START", "ACTION", "DECISION", "END"]),
});
export const designPreviewSchema = z.object({
  requirementId: z.uuid(),
  requirementVersion: z.number().int().positive(),
  generatorProfile: z.literal("LOCAL_DETERMINISTIC_V1"),
  classification: z.literal("PROPOSAL"),
  generatedAt: z.iso.datetime(),
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
export type DesignPreview = z.infer<typeof designPreviewSchema>;
