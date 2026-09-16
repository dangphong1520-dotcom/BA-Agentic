"use server";
import {
  createQuestionSchema,
  updateQuestionSchema,
  questionDtoSchema,
  entityIdSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export type QuestionFormState = { error?: string };
export async function saveQuestion(
  _previous: QuestionFormState,
  form: FormData,
): Promise<QuestionFormState> {
  const workspace = entityIdSchema.safeParse(form.get("workspaceId"));
  const project = entityIdSchema.safeParse(form.get("projectId"));
  const id = form.get("id");
  const fields = {
    question: form.get("question"),
    category: form.get("category"),
    priority: form.get("priority"),
    blocking: form.get("blocking") === "on",
    stakeholder: form.get("stakeholder"),
    requirementId: form.get("requirementId") || null,
  };
  const parsed = id
    ? updateQuestionSchema.safeParse({
        ...fields,
        answer: form.get("answer"),
        status: form.get("status"),
        expectedVersion: Number(form.get("expectedVersion")),
      })
    : createQuestionSchema.safeParse(fields);
  if (
    !workspace.success ||
    !project.success ||
    !parsed.success ||
    (id && !entityIdSchema.safeParse(id).success)
  )
    return {
      error:
        "Kiểm tra các trường bắt buộc. Câu hỏi đã trả lời hoặc đóng phải có câu trả lời.",
    };
  let saved;
  try {
    saved = await apiRequest(
      `/workspaces/${workspace.data}/projects/${project.data}/questions${id ? `/${id}` : ""}`,
      questionDtoSchema,
      { method: id ? "PATCH" : "POST", body: parsed.data },
    );
  } catch (error) {
    return {
      error:
        error instanceof ApiError && error.status === 409
          ? "Câu hỏi đã thay đổi hoặc đã đóng. Sao chép nội dung đang soạn, rồi mở lại câu hỏi để đối chiếu."
          : "Chưa lưu được. Kiểm tra quyền truy cập; cần lưu trạng thái Đã trả lời trước khi đóng.",
    };
  }
  revalidatePath("/questions");
  redirect(
    `/questions?workspace=${workspace.data}&project=${project.data}&id=${saved.id}&saved=1`,
  );
}
