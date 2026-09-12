"use client";

import { useActionState, useState } from "react";
import type { ProjectDto } from "@ba/contracts";
import { createWorkspace, saveProject } from "./actions";
import type { FormState } from "./actions";

export function WorkspaceForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createWorkspace,
    {},
  );
  const [name, setName] = useState("");
  return (
    <form action={action} className="workspace-form">
      <label htmlFor="workspace-name">Tên workspace</label>
      <input
        id="workspace-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ví dụ: Nhóm phân tích nghiệp vụ"
        maxLength={120}
        required
        readOnly={pending}
      />
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Đang tạo…" : "Tạo workspace"}
      </button>
    </form>
  );
}

export function ProjectForm({
  workspaceId,
  project,
}: {
  workspaceId: string;
  project?: ProjectDto;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveProject,
    {},
  );
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [goal, setGoal] = useState(project?.businessGoal ?? "");
  return (
    <form action={action} className="project-form">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {project && (
        <>
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="expectedVersion" value={project.version} />
        </>
      )}
      <div className="form-heading">
        <span className="eyebrow">BỐI CẢNH DỰ ÁN</span>
        <span className="muted small">* Bắt buộc</span>
      </div>
      <label htmlFor="project-name">
        Tên dự án <span aria-hidden="true">*</span>
      </label>
      <input
        id="project-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={120}
        placeholder="Ví dụ: Cải tiến quy trình tiếp nhận khách hàng"
        readOnly={pending}
      />
      <label htmlFor="project-goal">Mục tiêu kinh doanh</label>
      <p className="field-help" id="goal-help">
        Dự án cần tạo ra thay đổi gì cho doanh nghiệp?
      </p>
      <textarea
        id="project-goal"
        name="businessGoal"
        value={goal}
        onChange={(event) => setGoal(event.target.value)}
        aria-describedby="goal-help"
        maxLength={4000}
        rows={4}
        placeholder="Mô tả kết quả mong muốn và cách đánh giá thành công…"
        readOnly={pending}
      />
      <label htmlFor="project-description">Mô tả &amp; phạm vi</label>
      <p className="field-help" id="description-help">
        Ghi lại bối cảnh, đối tượng liên quan và giới hạn ban đầu.
      </p>
      <textarea
        id="project-description"
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        aria-describedby="description-help"
        maxLength={4000}
        rows={5}
        placeholder="Dự án giải quyết vấn đề nào? Phần nào nằm ngoài phạm vi?"
        readOnly={pending}
      />
      {state.error && (
        <div role="alert" className="error-panel">
          <p>{state.error}</p>
          {state.conflict && project && (
            <a
              href={`/?workspace=${workspaceId}&project=${project.id}`}
              target="_blank"
              rel="noreferrer"
            >
              Mở bản mới nhất trong tab khác ↗
            </a>
          )}
        </div>
      )}
      <div className="form-footer">
        <a className="button secondary" href={`/?workspace=${workspaceId}`}>
          Về danh sách
        </a>
        <button className="button primary" disabled={pending}>
          {pending ? "Đang lưu…" : project ? "Lưu thay đổi" : "Tạo dự án"}
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </form>
  );
}
