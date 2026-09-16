"use server";
import {
  createRequirementSchema,
  updateRequirementSchema,
  requirementDtoSchema,
  requirementTransitionSchema,
  entityIdSchema,
} from "@ba/contracts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/api";
export type RequirementFormState = { error?: string; conflict?: boolean };
export type RequirementTransitionState = { error?: string };
export async function saveRequirement(
  _previous: RequirementFormState,
  form: FormData,
): Promise<RequirementFormState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const project = entityIdSchema.safeParse(form.get("projectId"));
  const id = form.get("id");
  if (
    !workspace.success ||
    !project.success ||
    (id && !entityIdSchema.safeParse(id).success)
  )
    return { error: "Đường dẫn dự án hoặc yêu cầu chưa hợp lệ." };
  const fields = Object.fromEntries(
    [
      "title",
      "type",
      "priority",
      "description",
      "businessGoal",
      "actor",
      "preconditions",
      "mainFlow",
      "exceptionFlow",
      "acceptanceCriteria",
      "sourceNote",
    ].map((key) => [key, form.get(key)]),
  );
  const result = id
    ? updateRequirementSchema.safeParse({
        ...fields,
        expectedVersion: Number(form.get("expectedVersion")),
      })
    : createRequirementSchema.safeParse(fields);
  if (!result.success)
    return {
      error:
        "Nhập tiêu đề từ 1–120 ký tự, chọn loại và ưu tiên hợp lệ. Mỗi nội dung tối đa 4.000 ký tự.",
    };
  let savedId: string;
  try {
    const row = await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/requirements${id ? `/${id}` : ""}`,
      requirementDtoSchema,
      { method: id ? "PATCH" : "POST", body: result.data },
    );
    savedId = row.id;
  } catch (error) {
    return error instanceof ApiError
      ? {
          error:
            error.status === 409
              ? "Yêu cầu đã đổi ở phiên khác. Bản nháp của bạn vẫn còn; mở phiên bản mới nhất để đối chiếu."
              : error.message,
          conflict: error.status === 409,
        }
      : {
          error: "Chưa lưu được yêu cầu. Nội dung đang nhập vẫn được giữ lại.",
        };
  }
  revalidatePath("/requirements");
  redirect(
    `/requirements?workspace=${workspace.data}&project=${project.data}&id=${savedId}&saved=1`,
  );
}

const transitionEndpoints = {
  clarification: "request-clarification",
  review: "ready-for-review",
  approve: "approve",
  baseline: "baseline",
} as const;

export async function transitionRequirement(
  _previous: RequirementTransitionState,
  form: FormData,
): Promise<RequirementTransitionState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const project = entityIdSchema.safeParse(form.get("projectId"));
  const id = entityIdSchema.safeParse(form.get("id"));
  const input = requirementTransitionSchema.safeParse({
    expectedVersion: Number(form.get("expectedVersion")),
  });
  const intent = String(form.get("intent"));
  const endpoint =
    transitionEndpoints[intent as keyof typeof transitionEndpoints];
  if (
    !workspace.success ||
    !project.success ||
    !id.success ||
    !input.success ||
    !endpoint
  )
    return { error: "Yêu cầu chuyển trạng thái chưa hợp lệ." };

  try {
    await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/requirements/${id.data}/${endpoint}`,
      requirementDtoSchema,
      { method: "POST", body: input.data },
    );
  } catch (error) {
    return error instanceof ApiError
      ? {
          error:
            error.status === 409
              ? "Yêu cầu đã thay đổi hoặc không còn ở trạng thái phù hợp. Hãy mở lại trang để kiểm tra."
              : error.message,
        }
      : { error: "Chưa chuyển được trạng thái yêu cầu. Hãy thử lại." };
  }
  revalidatePath("/requirements");
  redirect(
    `/requirements?workspace=${workspace.data}&project=${project.data}&id=${id.data}&notice=${intent}`,
  );
}
