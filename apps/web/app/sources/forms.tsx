"use client";
import { useActionState, useState } from "react";
import type { SourceDto } from "@ba/contracts";
import { saveSource, attachEvidence } from "./actions";
export const sourceTypeLabels = {
  MANUAL_INPUT: "Ghi chép thủ công",
  MEETING: "Cuộc họp",
  DOCUMENT: "Tài liệu",
  EMAIL: "Email",
  CHAT: "Trao đổi",
};
export function SourceForm({
  workspaceId,
  projectId,
}: {
  workspaceId: string;
  projectId: string;
}) {
  const [state, action, pending] = useActionState(saveSource, {});
  const [title, setTitle] = useState("");
  const [type, setType] = useState("MANUAL_INPUT");
  const [content, setContent] = useState("");
  return (
    <form action={action} className="project-form panel">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      <label htmlFor="source-title">Tên nguồn *</label>
      <input
        id="source-title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={120}
        readOnly={pending}
      />
      <label htmlFor="source-type">Loại nguồn</label>
      <select
        id="source-type"
        name="type"
        value={type}
        onChange={(e) => {
          if (!pending) setType(e.target.value);
        }}
      >
        {Object.entries(sourceTypeLabels).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="source-content">Nội dung gốc *</label>
      <p className="field-help">
        Dán văn bản cần lưu. Mỗi dòng có nội dung tạo thành một đoạn trích. Tối
        đa 20.000 ký tự và 200 dòng.
      </p>
      <textarea
        id="source-content"
        name="content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        maxLength={20000}
        rows={12}
        readOnly={pending}
      />
      <p className="muted">
        Sau khi lưu, nội dung nguồn được giữ nguyên. Nếu có thay đổi, hãy tạo
        một nguồn mới.
      </p>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      <button className="button primary" disabled={pending}>
        {pending ? "Đang lưu…" : "Lưu nguồn"}
      </button>
    </form>
  );
}
export function EvidenceForm({
  workspaceId,
  projectId,
  requirementId,
  version,
  sources,
}: {
  workspaceId: string;
  projectId: string;
  requirementId: string;
  version: number;
  sources: SourceDto[];
}) {
  const [state, action, pending] = useActionState(attachEvidence, {});
  const [sourceId, setSource] = useState("");
  const [segmentId, setSegment] = useState("");
  const source = sources.find((row) => row.id === sourceId);
  const segment = source?.segments.find((row) => row.id === segmentId);
  return (
    <form action={action} className="project-form">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="requirementId" value={requirementId} />
      <input type="hidden" name="expectedVersion" value={version} />
      <label htmlFor="evidence-source">Chọn nguồn</label>
      <select
        id="evidence-source"
        value={sourceId}
        onChange={(e) => {
          if (!pending) {
            setSource(e.target.value);
            setSegment("");
          }
        }}
      >
        <option value="">Chọn một nguồn…</option>
        {sources.map((row) => (
          <option value={row.id} key={row.id}>
            {row.title}
          </option>
        ))}
      </select>
      <label htmlFor="evidence-segment">Chọn đoạn trích</label>
      <select
        id="evidence-segment"
        name="segmentId"
        value={segmentId}
        onChange={(e) => {
          if (!pending) setSegment(e.target.value);
        }}
        required
      >
        <option value="">Chọn một đoạn…</option>
        {source?.segments.map((row) => (
          <option value={row.id} key={row.id}>
            Dòng {row.line}: {row.text.slice(0, 80)}
          </option>
        ))}
      </select>
      {segment && (
        <blockquote className="preserve-lines">{segment.text}</blockquote>
      )}
      <p className="field-help">
        Gắn vào phiên bản {version} đã lưu. Nội dung đang sửa cần được lưu trước
        nếu bạn muốn gắn vào phiên bản mới.
      </p>
      {state.error && (
        <p role="alert" className="form-error">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}
      <button className="button primary" disabled={pending || !segmentId}>
        {pending ? "Đang gắn…" : "Gắn đoạn nguồn"}
      </button>
    </form>
  );
}
