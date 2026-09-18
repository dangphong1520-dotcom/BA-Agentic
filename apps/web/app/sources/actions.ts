"use server";
import {
  createSourceSchema,
  sourceDtoSchema,
  entityIdSchema,
  linkEvidenceSchema,
  evidenceDtoSchema,
  sourceAnalysisDtoSchema,
  sourceProposalTransitionSchema,
  updateSourceProposalSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export type SourceFormState = { error?: string; success?: string };
export type AnalysisFormState = { error?: string };
export type ProposalFormState = { error?: string; success?: string };
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

export async function analyzeSource(
  _previous: AnalysisFormState,
  form: FormData,
): Promise<AnalysisFormState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const project = entityIdSchema.safeParse(form.get("projectId"));
  const source = entityIdSchema.safeParse(form.get("sourceId"));
  if (!workspace.success || !project.success || !source.success)
    return { error: "Nguồn hoặc dự án chưa hợp lệ." };
  try {
    await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/sources/${source.data}/analyses`,
      sourceAnalysisDtoSchema,
      { method: "POST", body: {} },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Chưa phân tích được nguồn.",
    };
  }
  revalidatePath("/sources");
  redirect(
    `/sources?workspace=${workspace.data}&project=${project.data}&id=${source.data}&analyzed=1`,
  );
}

const proposalContext = (form: FormData) => ({
  workspace: entityIdSchema.safeParse(form.get("workspaceId")),
  project: entityIdSchema.safeParse(form.get("projectId")),
  source: entityIdSchema.safeParse(form.get("sourceId")),
  analysis: entityIdSchema.safeParse(form.get("analysisId")),
});

export async function saveSourceProposal(
  _previous: ProposalFormState,
  form: FormData,
): Promise<ProposalFormState> {
  const context = proposalContext(form);
  const data = updateSourceProposalSchema.safeParse({
    expectedVersion: Number(form.get("expectedVersion")),
    title: form.get("title"),
    type: form.get("type"),
    priority: form.get("priority"),
    description: form.get("description"),
    businessGoal: form.get("businessGoal"),
    actor: form.get("actor"),
    preconditions: form.get("preconditions"),
    mainFlow: form.get("mainFlow"),
    exceptionFlow: form.get("exceptionFlow"),
    acceptanceCriteria: form.get("acceptanceCriteria"),
    sourceNote: form.get("sourceNote"),
  });
  if (
    !context.workspace.success ||
    !context.project.success ||
    !context.source.success ||
    !context.analysis.success ||
    !data.success
  )
    return { error: "Kiểm tra lại nội dung đề xuất." };
  try {
    await apiRequest(
      `/workspaces/${context.workspace.data}/projects/${context.project.data}/source-analyses/${context.analysis.data}/proposal`,
      sourceAnalysisDtoSchema,
      { method: "PATCH", body: data.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Đề xuất đã thay đổi. Tải lại trang để xem bản mới nhất."
          : "Chưa lưu được đề xuất.",
    };
  }
  revalidatePath("/sources");
  return { success: "Đã lưu nội dung BA chỉnh sửa." };
}

async function transitionProposal(form: FormData, transition: "accept" | "reject") {
  const context = proposalContext(form);
  const data = sourceProposalTransitionSchema.safeParse({
    expectedVersion: Number(form.get("expectedVersion")),
  });
  if (
    !context.workspace.success ||
    !context.project.success ||
    !context.source.success ||
    !context.analysis.success ||
    !data.success
  )
    return { error: "Đề xuất chưa hợp lệ." };
  try {
    const updated = await apiRequest(
      `/workspaces/${context.workspace.data}/projects/${context.project.data}/source-analyses/${context.analysis.data}/${transition}`,
      sourceAnalysisDtoSchema,
      { method: "POST", body: data.data },
    );
    revalidatePath("/sources");
    return { context, updated };
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Đề xuất đã được xử lý hoặc có phiên bản mới."
          : "Chưa xử lý được đề xuất.",
    };
  }
}

export async function rejectSourceProposal(
  _previous: ProposalFormState,
  form: FormData,
): Promise<ProposalFormState> {
  const result = await transitionProposal(form, "reject");
  if ("error" in result) return { error: result.error };
  return { success: "Đã từ chối đề xuất." };
}

export async function acceptSourceProposal(
  _previous: ProposalFormState,
  form: FormData,
): Promise<ProposalFormState> {
  const result = await transitionProposal(form, "accept");
  if ("error" in result) return { error: result.error };
  if (!result.updated.acceptedRequirementId)
    return { error: "Chưa tạo được requirement." };
  redirect(
    `/requirements?workspace=${result.context.workspace.data}&project=${result.context.project.data}&id=${result.updated.acceptedRequirementId}&created=proposal`,
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
