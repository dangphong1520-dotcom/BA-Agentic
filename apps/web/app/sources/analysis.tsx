"use client";
import { useActionState } from "react";
import type { SourceAnalysisDto, SourceDto } from "@ba/contracts";
import { analyzeSource } from "./actions";

const classificationLabels = {
  FACT: "Sự kiện có nguồn",
  INFERENCE: "Suy luận",
  ASSUMPTION: "Giả định",
  PROPOSAL: "Đề xuất",
  OPEN_QUESTION: "Câu hỏi mở",
};

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
              <p className="preserve-lines">
                {run.result.requirement.description}
              </p>
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
              <p className="muted">
                Kết quả này chưa tạo requirement, câu hỏi, quy tắc hoặc quyết
                định trong dự án.
              </p>
            </>
          )}
        </details>
      ))}
    </section>
  );
}
