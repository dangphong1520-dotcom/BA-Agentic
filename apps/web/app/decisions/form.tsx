"use client";

import { useActionState, useState } from "react";
import type { DecisionDto, RequirementDto } from "@ba/contracts";
import { approveDecision, saveDecision, supersedeDecision } from "./actions";

export function DecisionForm({
  workspaceId,
  projectId,
  decision,
  requirements,
  approvedReplacements,
}: {
  workspaceId: string;
  projectId: string;
  decision?: DecisionDto;
  requirements: RequirementDto[];
  approvedReplacements: DecisionDto[];
}) {
  const [state, action, pending] = useActionState(saveDecision, {});
  const [approvalState, approvalAction, approving] = useActionState(
    approveDecision,
    {},
  );
  const [supersedeState, supersedeAction, superseding] = useActionState(
    supersedeDecision,
    {},
  );
  const [fields, setFields] = useState({
    title: decision?.title ?? "",
    description: decision?.description ?? "",
    rationale: decision?.rationale ?? "",
    requirementIds: decision?.requirementIds ?? [],
  });
  const locked =
    decision?.status !== undefined && decision.status !== "PROPOSED";
  const hidden = (
    <>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      {decision && <input type="hidden" name="id" value={decision.id} />}
      {decision && (
        <input type="hidden" name="expectedVersion" value={decision.version} />
      )}
    </>
  );
  return (
    <>
      <form action={action} className="project-form panel">
        {hidden}
        <fieldset
          disabled={pending || locked}
          style={{ border: 0, padding: 0, display: "grid", gap: "12px" }}
        >
          <label htmlFor="decision-title">Tên quyết định *</label>
          <input
            id="decision-title"
            name="title"
            required
            maxLength={120}
            value={fields.title}
            onChange={(event) =>
              setFields({ ...fields, title: event.target.value })
            }
          />
          <label htmlFor="decision-description">Nội dung quyết định *</label>
          <textarea
            id="decision-description"
            name="description"
            required
            rows={6}
            maxLength={4000}
            value={fields.description}
            onChange={(event) =>
              setFields({ ...fields, description: event.target.value })
            }
          />
          <label htmlFor="decision-rationale">Lý do lựa chọn *</label>
          <textarea
            id="decision-rationale"
            name="rationale"
            required
            rows={5}
            maxLength={4000}
            value={fields.rationale}
            onChange={(event) =>
              setFields({ ...fields, rationale: event.target.value })
            }
          />
          <fieldset style={{ display: "grid", gap: "8px" }}>
            <legend>Yêu cầu bị ảnh hưởng</legend>
            {requirements.length ? (
              requirements.map((requirement) => (
                <label key={requirement.id}>
                  <input
                    type="checkbox"
                    name="requirementIds"
                    value={requirement.id}
                    checked={fields.requirementIds.includes(requirement.id)}
                    onChange={(event) =>
                      setFields({
                        ...fields,
                        requirementIds: event.target.checked
                          ? [...fields.requirementIds, requirement.id]
                          : fields.requirementIds.filter(
                              (id) => id !== requirement.id,
                            ),
                      })
                    }
                  />{" "}
                  {requirement.title}
                </label>
              ))
            ) : (
              <p className="muted">Dự án chưa có yêu cầu để liên kết.</p>
            )}
          </fieldset>
        </fieldset>
        {locked ? (
          <p>Quyết định đã xử lý được khóa để bảo toàn lịch sử dự án.</p>
        ) : (
          <button className="button primary" disabled={pending}>
            {pending ? "Đang lưu…" : decision ? "Lưu thay đổi" : "Tạo đề xuất"}
          </button>
        )}
        {state.error && (
          <p className="error-panel" role="alert">
            {state.error}
          </p>
        )}
      </form>
      {decision?.status === "PROPOSED" && (
        <form action={approvalAction} className="panel project-form">
          {hidden}
          <h2>Phê duyệt của con người</h2>
          <p>Kiểm tra nội dung, lý do và phạm vi ảnh hưởng trước khi khóa.</p>
          <button className="button secondary" disabled={approving}>
            {approving ? "Đang phê duyệt…" : "Phê duyệt quyết định"}
          </button>
          {approvalState.error && (
            <p className="error-panel" role="alert">
              {approvalState.error}
            </p>
          )}
        </form>
      )}
      {decision?.status === "APPROVED" && (
        <form action={supersedeAction} className="panel project-form">
          {hidden}
          <h2>Thay thế quyết định</h2>
          <p>Quyết định cũ và lịch sử vẫn được giữ nguyên sau thao tác này.</p>
          {approvedReplacements.length ? (
            <>
              <label htmlFor="replacement">Quyết định mới đã phê duyệt</label>
              <select id="replacement" name="replacementDecisionId" required>
                <option value="">Chọn quyết định thay thế</option>
                {approvedReplacements.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.title}
                  </option>
                ))}
              </select>
              <button className="button secondary" disabled={superseding}>
                {superseding ? "Đang cập nhật…" : "Xác nhận thay thế"}
              </button>
            </>
          ) : (
            <p className="muted">
              Hãy tạo và phê duyệt quyết định mới trước khi thay thế quyết định
              này.
            </p>
          )}
          {supersedeState.error && (
            <p className="error-panel" role="alert">
              {supersedeState.error}
            </p>
          )}
        </form>
      )}
    </>
  );
}
