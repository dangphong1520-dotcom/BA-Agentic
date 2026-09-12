"use server";

import {
  createProjectSchema,
  createWorkspaceSchema,
  entityIdSchema,
  projectDtoSchema,
  updateProjectSchema,
  workspaceDtoSchema,
} from "@ba/contracts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";

export type FormState = { error?: string; conflict?: boolean };
function failure(error: unknown): FormState {
  return error instanceof ApiError
    ? { error: error.message, conflict: error.status === 409 }
    : { error: "Chưa lưu được thông tin. Vui lòng thử lại." };
}

export async function createWorkspace(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const result = createWorkspaceSchema.safeParse({ name: form.get("name") });
  if (!result.success)
    return { error: "Tên workspace cần có từ 1 đến 120 ký tự." };
  let id: string;
  try {
    id = (
      await apiRequest("/workspaces", workspaceDtoSchema, {
        method: "POST",
        body: result.data,
      })
    ).id;
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/");
  redirect(`/?workspace=${id}&notice=workspace-created`);
}

export async function saveProject(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const projectId = form.get("projectId");
  const project = projectId ? entityIdSchema.safeParse(projectId) : undefined;
  if (!workspace.success || (project && !project.success))
    return { error: "Workspace hoặc dự án chưa hợp lệ." };
  const fields = {
    name: form.get("name"),
    description: form.get("description"),
    businessGoal: form.get("businessGoal"),
  };
  const result = project
    ? updateProjectSchema.safeParse({
        ...fields,
        expectedVersion: Number(form.get("expectedVersion")),
      })
    : createProjectSchema.safeParse(fields);
  if (!result.success)
    return {
      error:
        "Tên dự án cần từ 1–120 ký tự; mô tả và mục tiêu tối đa 4.000 ký tự.",
    };
  let id: string;
  try {
    const suffix = project?.success ? `/${project.data}` : "";
    id = (
      await apiRequest(
        `/workspaces/${workspace.data}/projects${suffix}`,
        projectDtoSchema,
        { method: project ? "PATCH" : "POST", body: result.data },
      )
    ).id;
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/");
  redirect(`/?workspace=${workspace.data}&project=${id}&notice=saved`);
}
