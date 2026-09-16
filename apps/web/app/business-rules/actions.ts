"use server";

import {
  approveBusinessRuleSchema,
  businessRuleDtoSchema,
  createBusinessRuleSchema,
  entityIdSchema,
  updateBusinessRuleSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type BusinessRuleFormState = { error?: string };

function scope(form: FormData) {
  return {
    workspace: entityIdSchema.safeParse(form.get("workspaceId")),
    project: entityIdSchema.safeParse(form.get("projectId")),
    id: entityIdSchema.safeParse(form.get("id")),
  };
}

export async function saveBusinessRule(
  _previous: BusinessRuleFormState,
  form: FormData,
): Promise<BusinessRuleFormState> {
  const { workspace, project } = scope(form);
  const rawId = form.get("id");
  const id = rawId ? entityIdSchema.safeParse(rawId) : undefined;
  const fields = {
    title: form.get("title"),
    description: form.get("description"),
    priority: form.get("priority"),
    requirementIds: form.getAll("requirementIds"),
  };
  const parsed = rawId
    ? updateBusinessRuleSchema.safeParse({
        ...fields,
        expectedVersion: Number(form.get("expectedVersion")),
      })
    : createBusinessRuleSchema.safeParse(fields);
  if (
    !workspace.success ||
    !project.success ||
    !parsed.success ||
    (id && !id.success)
  )
    return { error: "Kiểm tra tiêu đề, nội dung và các yêu cầu liên quan." };
  let saved;
  try {
    saved = await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/business-rules${id ? `/${id.data}` : ""}`,
      businessRuleDtoSchema,
      { method: id ? "PATCH" : "POST", body: parsed.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Quy tắc đã thay đổi hoặc đã được phê duyệt. Mở lại để xem phiên bản mới nhất."
          : "Chưa lưu được quy tắc. Kiểm tra quyền truy cập và thử lại.",
    };
  }
  revalidatePath("/business-rules");
  redirect(
    `/business-rules?workspace=${workspace.data}&project=${project.data}&id=${saved.id}&saved=1`,
  );
}

export async function approveBusinessRule(
  _previous: BusinessRuleFormState,
  form: FormData,
): Promise<BusinessRuleFormState> {
  const { workspace, project, id } = scope(form);
  const approval = approveBusinessRuleSchema.safeParse({
    expectedVersion: Number(form.get("expectedVersion")),
  });
  if (
    !workspace.success ||
    !project.success ||
    !id.success ||
    !approval.success
  )
    return { error: "Yêu cầu phê duyệt chưa hợp lệ." };
  try {
    await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/business-rules/${id.data}/approve`,
      businessRuleDtoSchema,
      { method: "POST", body: approval.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Quy tắc đã thay đổi hoặc đã được phê duyệt. Mở lại để kiểm tra."
          : "Chưa phê duyệt được. Kiểm tra quyền truy cập và thử lại.",
    };
  }
  revalidatePath("/business-rules");
  redirect(
    `/business-rules?workspace=${workspace.data}&project=${project.data}&id=${id.data}&approved=1`,
  );
}
