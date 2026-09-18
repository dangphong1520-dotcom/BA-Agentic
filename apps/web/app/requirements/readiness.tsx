import Link from "next/link";
import type { RequirementReadiness as ReadinessDto } from "@ba/contracts";

const statusLabels = {
  READY: "Sẵn sàng",
  CONDITIONAL: "Sẵn sàng có điều kiện",
  NOT_READY: "Chưa sẵn sàng",
} as const;

const checkLabels = {
  DESCRIPTION: "Có mô tả yêu cầu",
  BUSINESS_GOAL: "Có mục tiêu kinh doanh",
  ACTOR: "Đã xác định tác nhân",
  MAIN_FLOW: "Có luồng chính",
  ACCEPTANCE_CRITERIA: "Có tiêu chí chấp nhận",
  SOURCE_EVIDENCE: "Có bằng chứng nguồn",
  BLOCKING_QUESTIONS: "Không còn câu hỏi chặn",
} as const;

export function RequirementReadiness({
  workspaceId,
  projectId,
  readiness,
}: {
  workspaceId: string;
  projectId: string;
  readiness: ReadinessDto;
}) {
  return (
    <section className="panel">
      <span className="eyebrow">DEV READY CHECK</span>
      <h2>{statusLabels[readiness.status]}</h2>
      <p className="muted">
        Đánh giá này hỗ trợ BA rà soát. Chỉ người dùng mới có thể chuyển trạng
        thái hoặc phê duyệt requirement.
      </p>
      <div className="stack">
        {readiness.checks.map((check) => (
          <p key={check.key}>
            <strong>{check.passed ? "✓" : check.hard ? "✕" : "!"}</strong>{" "}
            {checkLabels[check.key]}
          </p>
        ))}
      </div>
      <p className="muted">
        {readiness.evidenceCount} bằng chứng nguồn ·{" "}
        {readiness.unresolvedBlockingQuestionCount} câu hỏi đang chặn
      </p>
      {readiness.unresolvedBlockingQuestionCount > 0 && (
        <Link
          href={`/questions?workspace=${workspaceId}&project=${projectId}&requirement=${readiness.requirementId}&blocking=1`}
        >
          Mở câu hỏi đang chặn →
        </Link>
      )}
    </section>
  );
}
