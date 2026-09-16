"use client";

import { useActionState, useState } from "react";
import type { BusinessRuleDto, RequirementDto } from "@ba/contracts";
import { businessRulePrioritySchema } from "@ba/contracts";
import { approveBusinessRule, saveBusinessRule } from "./actions";
import { priorityLabels } from "./labels";

export function BusinessRuleForm({
  workspaceId,
  projectId,
  rule,
  requirements,
}: {
  workspaceId: string;
  projectId: string;
  rule?: BusinessRuleDto;
  requirements: RequirementDto[];
}) {
  const [state, action, pending] = useActionState(saveBusinessRule, {});
  const [approvalState, approvalAction, approving] = useActionState(
    approveBusinessRule,
    {},
  );
  const [fields, setFields] = useState({
    title: rule?.title ?? "",
    description: rule?.description ?? "",
    priority: rule?.priority ?? ("MEDIUM" as const),
    requirementIds: rule?.requirementIds ?? [],
  });
  const locked = rule?.status !== undefined && rule.status !== "DRAFT";
  return (
    <>
      <form action={action} className="project-form panel">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <input type="hidden" name="projectId" value={projectId} />
        {rule && (
          <>
            <input type="hidden" name="id" value={rule.id} />
            <input type="hidden" name="expectedVersion" value={rule.version} />
          </>
        )}
        <fieldset
          disabled={pending || locked}
          style={{ border: 0, padding: 0, display: "grid", gap: "12px" }}
        >
          <label htmlFor="rule-title">Tên quy tắc *</label>
          <input
            id="rule-title"
            name="title"
            required
            maxLength={120}
            value={fields.title}
            onChange={(event) =>
              setFields({ ...fields, title: event.target.value })
            }
          />
          <label htmlFor="rule-description">Nội dung quy tắc *</label>
          <textarea
            id="rule-description"
            name="description"
            required
            rows={8}
            maxLength={4000}
            value={fields.description}
            onChange={(event) =>
              setFields({ ...fields, description: event.target.value })
            }
          />
          <label htmlFor="rule-priority">Mức ưu tiên</label>
          <select
            id="rule-priority"
            name="priority"
            value={fields.priority}
            onChange={(event) =>
              setFields({
                ...fields,
                priority: businessRulePrioritySchema.parse(event.target.value),
              })
            }
          >
            {Object.entries(priorityLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <fieldset style={{ display: "grid", gap: "8px" }}>
            <legend>Yêu cầu chịu sự chi phối</legend>
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
          <p>Quy tắc đã phê duyệt được khóa để bảo toàn tri thức dự án.</p>
        ) : (
          <button className="button primary" disabled={pending}>
            {pending ? "Đang lưu…" : rule ? "Lưu thay đổi" : "Tạo bản nháp"}
          </button>
        )}
        {state.error && (
          <p className="error-panel" role="alert">
            {state.error}
          </p>
        )}
      </form>
      {rule?.status === "DRAFT" && (
        <form action={approvalAction} className="panel project-form">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="id" value={rule.id} />
          <input type="hidden" name="expectedVersion" value={rule.version} />
          <h2>Phê duyệt của con người</h2>
          <p>
            Hãy kiểm tra nội dung và các yêu cầu liên quan. Sau khi phê duyệt,
            phiên bản này sẽ được khóa.
          </p>
          <button className="button secondary" disabled={approving}>
            {approving ? "Đang phê duyệt…" : "Phê duyệt quy tắc"}
          </button>
          {approvalState.error && (
            <p className="error-panel" role="alert">
              {approvalState.error}
            </p>
          )}
        </form>
      )}
    </>
  );
}
