"use client";
import { useActionState, useState } from "react";
import type { RequirementDto } from "@ba/contracts";
import { saveRequirement } from "./actions";
import { typeLabels, priorityLabels, statusLabels, textFields } from "./labels";
export function RequirementForm({
  workspaceId,
  projectId,
  requirement,
}: {
  workspaceId: string;
  projectId: string;
  requirement?: RequirementDto;
}) {
  const [state, action, pending] = useActionState(saveRequirement, {});
  const [draft, setDraft] = useState({
    title: requirement?.title ?? "",
    type: String(requirement?.type ?? "FUNCTIONAL"),
    priority: String(requirement?.priority ?? "UNDEFINED"),
    description: requirement?.description ?? "",
    businessGoal: requirement?.businessGoal ?? "",
    actor: requirement?.actor ?? "",
    preconditions: requirement?.preconditions ?? "",
    mainFlow: requirement?.mainFlow ?? "",
    exceptionFlow: requirement?.exceptionFlow ?? "",
    acceptanceCriteria: requirement?.acceptanceCriteria ?? "",
    sourceNote: requirement?.sourceNote ?? "",
  });
  const base = `/requirements?workspace=${workspaceId}&project=${projectId}`;
  const editable =
    !requirement ||
    requirement.status === "DRAFT" ||
    requirement.status === "CLARIFICATION_REQUIRED";
  return (
    <form action={action} className="project-form">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      {requirement && (
        <>
          <input type="hidden" name="id" value={requirement.id} />
          <input
            type="hidden"
            name="expectedVersion"
            value={requirement.version}
          />
        </>
      )}
      <p className="eyebrow">
        {requirement ? statusLabels[requirement.status] : "Bản nháp mới"}
      </p>
      {requirement && (
        <p className="muted">
          Đang chỉnh sửa từ phiên bản {requirement.version} đã lưu.
        </p>
      )}
      {!editable && (
        <p className="muted">
          Nội dung đã khóa ở trạng thái này. Hãy dùng thao tác vòng đời bên
          dưới.
        </p>
      )}
      <fieldset disabled={pending || !editable} style={{ display: "contents" }}>
        <label htmlFor="requirement-title">Tiêu đề yêu cầu *</label>
        <input
          id="requirement-title"
          name="title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          maxLength={120}
          required
          readOnly={pending}
        />
        <label htmlFor="requirement-type">Loại yêu cầu</label>
        <select
          id="requirement-type"
          name="type"
          value={draft.type}
          onChange={(e) =>
            !pending && setDraft({ ...draft, type: e.target.value })
          }
          aria-disabled={pending}
        >
          {Object.entries(typeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <label htmlFor="requirement-priority">Mức ưu tiên</label>
        <select
          id="requirement-priority"
          name="priority"
          value={draft.priority}
          onChange={(e) =>
            !pending &&
            setDraft({
              ...draft,
              priority: e.target.value,
            })
          }
          aria-disabled={pending}
        >
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {textFields.map(([key, label]) => (
          <div key={key} className="requirement-field">
            <label htmlFor={`requirement-${key}`}>{label}</label>
            {key === "sourceNote" && (
              <p className="field-help">
                Ghi lại nguồn gốc và điều chưa chắc chắn. Ghi chú này chưa phải
                liên kết bằng chứng đã xác minh.
              </p>
            )}
            <textarea
              id={`requirement-${key}`}
              name={key}
              rows={3}
              maxLength={4000}
              value={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              readOnly={pending}
            />
          </div>
        ))}
      </fieldset>
      {state.error && (
        <div role="alert" className="error-panel">
          <p>{state.error}</p>
          {state.conflict && requirement && (
            <a
              href={`${base}&id=${requirement.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Mở phiên bản mới nhất ↗
            </a>
          )}
        </div>
      )}
      <div className="form-footer">
        <a className="button secondary" href={base}>
          Về danh sách yêu cầu
        </a>
        {editable && (
          <button className="button primary" disabled={pending}>
            {pending ? "Đang lưu…" : "Lưu nội dung"}
          </button>
        )}
      </div>
    </form>
  );
}
