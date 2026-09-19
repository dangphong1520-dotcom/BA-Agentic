import { z } from "zod";
export * from "./requirements.js";
export * from "./sources.js";
export * from "./source-analyses.js";
export * from "./findings.js";
export * from "./traceability.js";
export * from "./portfolio.js";
export * from "./design-studio.js";
export * from "./documents.js";
export * from "./questions.js";
export * from "./business-rules.js";
export * from "./decisions.js";

export const entityIdSchema = z.uuid();
const nameSchema = z.string().trim().min(1).max(120);
const descriptionSchema = z.string().trim().max(4000);
export const createWorkspaceSchema = z.strictObject({ name: nameSchema });
export const createProjectSchema = z.strictObject({
  name: nameSchema,
  description: descriptionSchema.default(""),
  businessGoal: descriptionSchema.default(""),
});
export const updateProjectSchema = z
  .strictObject({
    name: nameSchema.optional(),
    description: descriptionSchema.optional(),
    businessGoal: descriptionSchema.optional(),
    expectedVersion: z.number().int().positive(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.businessGoal !== undefined,
    { message: "At least one project field is required" },
  );

export type CreateWorkspace = z.infer<typeof createWorkspaceSchema>;
export type CreateProject = z.infer<typeof createProjectSchema>;
export type UpdateProject = z.infer<typeof updateProjectSchema>;

export const workspaceDtoSchema = z.object({
  id: entityIdSchema,
  name: nameSchema,
  createdAt: z.iso.datetime(),
});
export const projectDtoSchema = z.object({
  id: entityIdSchema,
  workspaceId: entityIdSchema,
  name: nameSchema,
  description: descriptionSchema,
  businessGoal: descriptionSchema,
  version: z.number().int().positive(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type WorkspaceDto = z.infer<typeof workspaceDtoSchema>;
export type ProjectDto = z.infer<typeof projectDtoSchema>;
