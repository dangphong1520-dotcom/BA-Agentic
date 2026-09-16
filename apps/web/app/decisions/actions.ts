"use server";

import {
  approveDecisionSchema,
  createDecisionSchema,
  decisionDtoSchema,
  entityIdSchema,
  supersedeDecisionSchema,
  updateDecisionSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type DecisionFormState = { error?: string };

function scope(form: FormData) {
  return {
    workspace: entityIdSchema.safeParse(form.get("workspaceId")),
    project: entityIdSchema.safeParse(form.get("projectId")),
    id: entityIdSchema.safeParse(form.get("id")),
  };
}

export async function saveDecision(
  _previous: DecisionFormState,
  form: FormData,
): Promise<DecisionFormState> {
  const { workspace, project } = scope(form);
  const rawId = form.get("id");
  const id = rawId ? entityIdSchema.safeParse(rawId) : undefined;
  const fields = {
    title: form.get("title"),
    description: form.get("description"),
    rationale: form.get("rationale"),
    requirementIds: form.getAll("requirementIds"),
  };
  const parsed = rawId
    ? updateDecisionSchema.safeParse({
        ...fields,
        expectedVersion: Number(form.get("expectedVersion")),
      })
    : createDecisionSchema.safeParse(fields);
  if (
    !workspace.success ||
    !project.success ||
    !parsed.success ||
    (id && !id.success)
  )
    return { error: "Kiểm tra tiêu đề, nội dung, lý do và yêu cầu liên quan." };
  let saved;
  try {
    saved = await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/decisions${id ? `/${id.data}` : ""}`,
      decisionDtoSchema,
      { method: id ? "PATCH" : "POST", body: parsed.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Quyết định đã thay đổi hoặc không còn ở trạng thái đề xuất. Mở lại để kiểm tra."
          : "Chưa lưu được quyết định. Kiểm tra quyền truy cập và thử lại.",
    };
  }
  revalidatePath("/decisions");
  redirect(
    `/decisions?workspace=${workspace.data}&project=${project.data}&id=${saved.id}&saved=1`,
  );
}

export async function approveDecision(
  _previous: DecisionFormState,
  form: FormData,
): Promise<DecisionFormState> {
  const { workspace, project, id } = scope(form);
  const parsed = approveDecisionSchema.safeParse({
    expectedVersion: Number(form.get("expectedVersion")),
  });
  if (!workspace.success || !project.success || !id.success || !parsed.success)
    return { error: "Yêu cầu phê duyệt chưa hợp lệ." };
  try {
    await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/decisions/${id.data}/approve`,
      decisionDtoSchema,
      { method: "POST", body: parsed.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Quyết định đã thay đổi hoặc đã được xử lý. Mở lại để kiểm tra."
          : "Chưa phê duyệt được. Kiểm tra quyền truy cập và thử lại.",
    };
  }
  revalidatePath("/decisions");
  redirect(
    `/decisions?workspace=${workspace.data}&project=${project.data}&id=${id.data}&approved=1`,
  );
}

export async function supersedeDecision(
  _previous: DecisionFormState,
  form: FormData,
): Promise<DecisionFormState> {
  const { workspace, project, id } = scope(form);
  const parsed = supersedeDecisionSchema.safeParse({
    expectedVersion: Number(form.get("expectedVersion")),
    replacementDecisionId: form.get("replacementDecisionId"),
  });
  if (!workspace.success || !project.success || !id.success || !parsed.success)
    return { error: "Chọn một quyết định thay thế hợp lệ." };
  try {
    await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/decisions/${id.data}/supersede`,
      decisionDtoSchema,
      { method: "POST", body: parsed.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Quyết định đã thay đổi hoặc quyết định thay thế chưa được phê duyệt."
          : "Chưa thay thế được quyết định. Kiểm tra quyền truy cập và thử lại.",
    };
  }
  revalidatePath("/decisions");
  redirect(
    `/decisions?workspace=${workspace.data}&project=${project.data}&id=${id.data}&superseded=1`,
  );
}
