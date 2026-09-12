import { z } from "zod";

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

export interface WorkspaceDto {
  id: string;
  name: string;
  createdAt: string;
}
export interface ProjectDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  businessGoal: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}
