"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { RequirementDto } from "@ba/contracts";
import { transitionRequirement } from "./actions";
import { statusLabels } from "./labels";

export function RequirementLifecycle({
  workspaceId,
  projectId,
  requirement,
}: {
  workspaceId: string;
  projectId: string;
  requirement: RequirementDto;
}) {
  const [state, action, pending] = useActionState(transitionRequirement, {});
  const canClarify =
    requirement.status === "DRAFT" || requirement.status === "READY_FOR_REVIEW";
  const canReview =
    requirement.status === "DRAFT" ||
    requirement.status === "CLARIFICATION_REQUIRED";

  return (
    <form action={action} className="panel project-form">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="id" value={requirement.id} />
      <input type="hidden" name="expectedVersion" value={requirement.version} />
      <h2>Vòng đời yêu cầu</h2>
      <p>
        Trạng thái hiện tại: <strong>{statusLabels[requirement.status]}</strong>
      </p>
      {requirement.approvedBy && requirement.approvedAt && (
        <p className="muted">
          Phê duyệt bởi người dùng {requirement.approvedBy} lúc{" "}
          {new Date(requirement.approvedAt).toLocaleString("vi-VN")}.
        </p>
      )}
      {requirement.baselinedBy && requirement.baselinedAt && (
        <p className="muted">
          Chốt baseline bởi người dùng {requirement.baselinedBy} lúc{" "}
          {new Date(requirement.baselinedAt).toLocaleString("vi-VN")}.
        </p>
      )}
      <div className="form-footer">
        {canClarify && (
          <button
            className="button secondary"
            name="intent"
            value="clarification"
            disabled={pending}
          >
            Yêu cầu làm rõ
          </button>
        )}
        {canReview && (
          <button
            className="button primary"
            name="intent"
            value="review"
            disabled={pending}
          >
            Đưa sang chờ phê duyệt
          </button>
        )}
        {requirement.status === "READY_FOR_REVIEW" && (
          <button
            className="button primary"
            name="intent"
            value="approve"
            disabled={pending}
          >
            Phê duyệt với danh tính của tôi
          </button>
        )}
        {requirement.status === "APPROVED" && (
          <button
            className="button primary"
            name="intent"
            value="baseline"
            disabled={pending}
          >
            Chốt baseline
          </button>
        )}
      </div>
      {requirement.status === "BASELINED" && (
        <p className="success-message" role="status">
          Yêu cầu đã được chốt làm baseline.
        </p>
      )}
      {state.error && (
        <p className="error-panel" role="alert">
          {state.error}{" "}
          {state.blockedByQuestions && (
            <Link
              href={`/questions?workspace=${workspaceId}&project=${projectId}&requirement=${requirement.id}&blocking=1`}
            >
              Mở câu hỏi đang chặn →
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
