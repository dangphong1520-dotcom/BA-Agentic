"use client";
import { useActionState, useState } from "react";
import type { QuestionDto, RequirementDto } from "@ba/contracts";
import {
  questionCategorySchema,
  questionPrioritySchema,
  questionStatusSchema,
} from "@ba/contracts";
import { saveQuestion } from "./actions";
import { categoryLabels, priorityLabels, statusLabels } from "./labels";
export function QuestionForm({
  workspaceId,
  projectId,
  question,
  requirements,
  requirementId,
}: {
  workspaceId: string;
  projectId: string;
  question?: QuestionDto;
  requirements: RequirementDto[];
  requirementId?: string;
}) {
  const [state, action, pending] = useActionState(saveQuestion, {});
  const [fields, setFields] = useState({
    question: question?.question ?? "",
    category: question?.category ?? "BUSINESS",
    priority: question?.priority ?? "MEDIUM",
    blocking: question?.blocking ?? false,
    stakeholder: question?.stakeholder ?? "",
    requirementId: question?.requirementId ?? requirementId ?? "",
    answer: question?.answer ?? "",
    status: question?.status ?? "OPEN",
  });
  const closed = question?.status === "CLOSED";
  return (
    <form action={action} className="project-form panel">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      {question && (
        <>
          <input type="hidden" name="id" value={question.id} />
          <input
            type="hidden"
            name="expectedVersion"
            value={question.version}
          />
        </>
      )}
      <fieldset
        disabled={pending || closed}
        style={{ border: 0, padding: 0, display: "grid", gap: "12px" }}
      >
        <label htmlFor="question-text">Câu hỏi cần làm rõ *</label>
        <textarea
          id="question-text"
          name="question"
          rows={4}
          maxLength={2000}
          required
          value={fields.question}
          onChange={(e) => setFields({ ...fields, question: e.target.value })}
        />
        <label htmlFor="question-category">Nhóm câu hỏi</label>
        <select
          id="question-category"
          name="category"
          value={fields.category}
          onChange={(e) =>
            setFields({
              ...fields,
              category: questionCategorySchema.parse(e.target.value),
            })
          }
        >
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="question-priority">Mức ưu tiên</label>
        <select
          id="question-priority"
          name="priority"
          value={fields.priority}
          onChange={(e) =>
            setFields({
              ...fields,
              priority: questionPrioritySchema.parse(e.target.value),
            })
          }
        >
          {Object.entries(priorityLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            name="blocking"
            checked={fields.blocking}
            onChange={(e) =>
              setFields({ ...fields, blocking: e.target.checked })
            }
          />{" "}
          Cần giải đáp để tiếp tục công việc
        </label>
        <label htmlFor="question-stakeholder">Người hoặc vai trò cần hỏi</label>
        <input
          id="question-stakeholder"
          name="stakeholder"
          maxLength={120}
          value={fields.stakeholder}
          onChange={(e) =>
            setFields({ ...fields, stakeholder: e.target.value })
          }
        />
        <label htmlFor="question-requirement">Yêu cầu liên quan</label>
        <select
          id="question-requirement"
          name="requirementId"
          value={fields.requirementId}
          onChange={(e) =>
            setFields({ ...fields, requirementId: e.target.value })
          }
        >
          <option value="">Câu hỏi chung của dự án</option>
          {requirements.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        {question && (
          <>
            <label htmlFor="question-answer">Câu trả lời</label>
            <textarea
              id="question-answer"
              name="answer"
              rows={5}
              maxLength={4000}
              value={fields.answer}
              onChange={(e) => setFields({ ...fields, answer: e.target.value })}
            />
            <label htmlFor="question-status">Trạng thái</label>
            <select
              id="question-status"
              name="status"
              value={fields.status}
              onChange={(e) =>
                setFields({
                  ...fields,
                  status: questionStatusSchema.parse(e.target.value),
                })
              }
            >
              {Object.entries(statusLabels)
                .filter(
                  ([key]) => key !== "CLOSED" || question.status !== "OPEN",
                )
                .map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
            </select>
            <p className="muted">
              Lưu câu trả lời trước khi đóng. Đóng câu hỏi không tự cập nhật
              hoặc phê duyệt yêu cầu.
            </p>
          </>
        )}
      </fieldset>
      {closed ? (
        <p>Câu hỏi đã đóng. Nội dung và lịch sử được giữ nguyên.</p>
      ) : (
        <button className="button primary" disabled={pending}>
          {pending ? "Đang lưu…" : question ? "Lưu thay đổi" : "Tạo câu hỏi"}
        </button>
      )}
      {state.error && (
        <p className="error-panel" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
