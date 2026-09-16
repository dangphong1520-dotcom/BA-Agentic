"use server";
import {
  createSourceSchema,
  sourceDtoSchema,
  entityIdSchema,
  linkEvidenceSchema,
  evidenceDtoSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export type SourceFormState = { error?: string; success?: string };
export async function saveSource(
  _previous: SourceFormState,
  form: FormData,
): Promise<SourceFormState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const project = entityIdSchema.safeParse(form.get("projectId"));
  const fields = createSourceSchema.safeParse({
    title: form.get("title"),
    type: form.get("type"),
    content: form.get("content"),
  });
  if (!workspace.success || !project.success || !fields.success)
    return {
      error:
        "Kiểm tra tiêu đề, loại nguồn và nội dung (tối đa 20.000 ký tự, 200 dòng, 4.000 ký tự mỗi dòng).",
    };
  let id;
  try {
    id = (
      await apiRequest(
        `/workspaces/${workspace.data}/projects/${project.data}/sources`,
        sourceDtoSchema,
        { method: "POST", body: fields.data },
      )
    ).id;
  } catch (error) {
    return {
      error: error instanceof ApiError ? error.message : "Chưa lưu được nguồn.",
    };
  }
  revalidatePath("/sources");
  redirect(
    `/sources?workspace=${workspace.data}&project=${project.data}&id=${id}`,
  );
}
export async function attachEvidence(
  _previous: SourceFormState,
  form: FormData,
): Promise<SourceFormState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const project = entityIdSchema.safeParse(form.get("projectId"));
  const requirement = entityIdSchema.safeParse(form.get("requirementId"));
  const data = linkEvidenceSchema.safeParse({
    segmentId: form.get("segmentId"),
    expectedVersion: Number(form.get("expectedVersion")),
  });
  if (
    !workspace.success ||
    !project.success ||
    !requirement.success ||
    !data.success
  )
    return { error: "Chọn một đoạn nguồn hợp lệ." };
  try {
    await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/requirements/${requirement.data}/evidence`,
      evidenceDtoSchema,
      { method: "POST", body: data.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Yêu cầu đã có phiên bản mới. Mở lại yêu cầu và đối chiếu trước khi gắn nguồn."
          : "Chưa gắn được nguồn. Kiểm tra quyền truy cập và thử lại.",
    };
  }
  // Keep the draft editor mounted: this action does not change its content.
  revalidatePath("/requirements");
  return { success: "Đã gắn đoạn nguồn vào phiên bản đang xem." };
}
