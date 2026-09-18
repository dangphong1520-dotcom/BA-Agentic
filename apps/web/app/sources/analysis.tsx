"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { SourceAnalysisDto, SourceDto } from "@ba/contracts";
import {
  acceptSourceProposal,
  analyzeSource,
  rejectSourceProposal,
  saveSourceProposal,
} from "./actions";

const classificationLabels = {
  FACT: "Sự kiện có nguồn",
  INFERENCE: "Suy luận",
  ASSUMPTION: "Giả định",
  PROPOSAL: "Đề xuất",
  OPEN_QUESTION: "Câu hỏi mở",
};

const textFields = [
  ["description", "Mô tả"],
  ["businessGoal", "Mục tiêu kinh doanh"],
  ["actor", "Tác nhân"],
  ["preconditions", "Điều kiện trước"],
  ["mainFlow", "Luồng chính"],
  ["exceptionFlow", "Luồng ngoại lệ"],
  ["acceptanceCriteria", "Tiêu chí chấp nhận"],
  ["sourceNote", "Ghi chú nguồn"],
] as const;

function ProposalReview({
  workspaceId,
  projectId,
  sourceId,
  run,
}: {
  workspaceId: string;
  projectId: string;
  sourceId: string;
  run: SourceAnalysisDto & { result: NonNullable<SourceAnalysisDto["result"]> };
}) {
  const [saveState, saveAction, saving] = useActionState(saveSourceProposal, {});
  const [rejectState, rejectAction, rejecting] = useActionState(
    rejectSourceProposal,
    {},
  );
  const [acceptState, acceptAction, accepting] = useActionState(
    acceptSourceProposal,
    {},
  );
  const hidden = (
    <>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="sourceId" value={sourceId} />
      <input type="hidden" name="analysisId" value={run.id} />
      <input type="hidden" name="expectedVersion" value={run.version} />
    </>
  );
  if (run.reviewStatus === "ACCEPTED")
    return (
      <div className="success-panel">
        Đề xuất đã được chấp nhận và tạo thành requirement bản nháp.{" "}
        {run.acceptedRequirementId && (
          <Link
            href={`/requirements?workspace=${workspaceId}&project=${projectId}&id=${run.acceptedRequirementId}`}
          >
            Mở requirement
          </Link>
        )}
      </div>
    );
  if (run.reviewStatus === "REJECTED")
    return <p className="muted">BA đã từ chối đề xuất này.</p>;
  const proposal = run.result.requirement;
  return (
    <>
      <form action={saveAction} className="stack">
        {hidden}
        <label>
          Tiêu đề
          <input name="title" defaultValue={proposal.title} required />
        </label>
        <div className="two-column">
          <label>
            Loại yêu cầu
            <select name="type" defaultValue={proposal.type}>
              <option value="BUSINESS">Nghiệp vụ</option>
              <option value="FUNCTIONAL">Chức năng</option>
              <option value="NON_FUNCTIONAL">Phi chức năng</option>
            </select>
          </label>
          <label>
            Độ ưu tiên
            <select name="priority" defaultValue={proposal.priority}>
              <option value="UNDEFINED">Chưa xác định</option>
              <option value="MUST">Must</option>
              <option value="SHOULD">Should</option>
              <option value="COULD">Could</option>
              <option value="WONT">Won&apos;t</option>
            </select>
          </label>
        </div>
        {textFields.map(([name, label]) => (
          <label key={name}>
            {label}
            <textarea name={name} defaultValue={proposal[name]} rows={3} />
          </label>
        ))}
        {saveState.error && <p className="error-panel">{saveState.error}</p>}
        {saveState.success && <p className="success-panel">{saveState.success}</p>}
        <button className="button" disabled={saving}>
          {saving ? "Đang lưu…" : "Lưu chỉnh sửa"}
        </button>
      </form>
      <div className="button-row">
        <form action={rejectAction}>
          {hidden}
          <button className="button" disabled={rejecting}>
            {rejecting ? "Đang xử lý…" : "Từ chối đề xuất"}
          </button>
        </form>
        <form action={acceptAction}>
          {hidden}
          <button className="button primary" disabled={accepting}>
            {accepting ? "Đang tạo…" : "Chấp nhận và tạo requirement"}
          </button>
        </form>
      </div>
      {(rejectState.error || acceptState.error) && (
        <p className="error-panel">{rejectState.error || acceptState.error}</p>
      )}
    </>
  );
}

export function SourceAnalysisPanel({
  workspaceId,
  projectId,
  source,
  analyses,
}: {
  workspaceId: string;
  projectId: string;
  source: SourceDto;
  analyses: SourceAnalysisDto[];
}) {
  const [state, action, pending] = useActionState(analyzeSource, {});
  const segments = new Map(source.segments.map((row) => [row.id, row]));
  return (
    <section className="panel">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AI · CHỈ TẠO ĐỀ XUẤT</span>
          <h2>Phân tích nguồn</h2>
          <p>
            Tạo bản nháp có cấu trúc, điểm thiếu và câu hỏi. Bạn vẫn là người
            quyết định nội dung nào được sử dụng.
          </p>
        </div>
        <form action={action}>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="sourceId" value={source.id} />
          <button className="button primary" disabled={pending}>
            {pending ? "Đang phân tích…" : "Phân tích nguồn"}
          </button>
        </form>
      </div>
      {state.error && (
        <p className="error-panel" role="alert">
          {state.error}
        </p>
      )}
      {!analyses.length && <p className="muted">Chưa có lần phân tích nào.</p>}
      {analyses.map((run) => (
        <details
          className="source-segment"
          key={run.id}
          open={run === analyses[0]}
        >
          <summary>
            {run.status === "COMPLETED"
              ? "Đã hoàn thành"
              : run.status === "FAILED"
                ? "Thất bại"
                : "Đang chạy"}{" "}
            · {new Date(run.createdAt).toLocaleString("vi-VN")}
          </summary>
          <p className="muted">
            Nguồn bản {run.sourceRevision} · {run.modelProfile}
          </p>
          {run.errorMessage && (
            <p className="error-panel">{run.errorMessage}</p>
          )}
          {run.result && (
            <>
              <h3>Đề xuất yêu cầu: {run.result.requirement.title}</h3>
              <p>
                <strong>
                  {classificationLabels[run.result.requirement.classification]}
                </strong>{" "}
                · độ tin cậy{" "}
                {Math.round(run.result.requirement.confidence * 100)}%
              </p>
              <ProposalReview
                workspaceId={workspaceId}
                projectId={projectId}
                sourceId={source.id}
                run={{ ...run, result: run.result }}
              />
              <h3>Điểm cần chú ý</h3>
              {run.result.findings.map((finding, index) => (
                <article key={`${finding.type}-${index}`}>
                  <strong>
                    {finding.type} ·{" "}
                    {classificationLabels[finding.classification]}
                  </strong>
                  <p>{finding.description}</p>
                </article>
              ))}
              <h3>Câu hỏi làm rõ đề xuất</h3>
              {run.result.questions.map((question, index) => (
                <article key={index}>
                  <strong>{question.question}</strong>
                  <p>{question.reason}</p>
                </article>
              ))}
              <h3>Bằng chứng nguồn</h3>
              {[...new Set(run.result.requirement.evidenceSegmentIds)].map(
                (segmentId) => {
                  const segment = segments.get(segmentId);
                  return segment ? (
                    <blockquote key={segmentId}>
                      Dòng {segment.line}: {segment.text}
                    </blockquote>
                  ) : null;
                },
              )}
              {run.reviewStatus === "PENDING" && (
                <p className="muted">
                  Kết quả chỉ trở thành requirement khi BA chấp nhận.
                </p>
              )}
            </>
          )}
        </details>
      ))}
    </section>
  );
}
