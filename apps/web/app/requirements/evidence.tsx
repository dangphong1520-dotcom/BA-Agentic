import Link from "next/link";
import { evidenceDtoSchema, sourceDtoSchema } from "@ba/contracts";
import { apiRequest } from "@/lib/api";
import { EvidenceForm } from "../sources/forms";
export async function RequirementEvidence({
  workspaceId,
  projectId,
  requirementId,
  version,
}: {
  workspaceId: string;
  projectId: string;
  requirementId: string;
  version: number;
}) {
  const apiBase = `/workspaces/${workspaceId}/projects/${projectId}`;
  let data;
  try {
    const [sources, links] = await Promise.all([
      apiRequest(`${apiBase}/sources`, sourceDtoSchema.array()),
      apiRequest(
        `${apiBase}/requirements/${requirementId}/evidence`,
        evidenceDtoSchema.array(),
      ),
    ]);
    data = { sources, links };
  } catch {
    return (
      <section className="panel">
        <h2>Nguồn tham chiếu</h2>
        <p role="alert">
          Chưa tải được nguồn tham chiếu. Hãy mở lại trang để thử lại.
        </p>
      </section>
    );
  }
  return (
    <section className="panel evidence-panel">
      <h2>Nguồn tham chiếu</h2>
      <p>
        Đoạn nguồn được gắn với từng phiên bản. Liên kết tham chiếu không đồng
        nghĩa với xác nhận nội dung là đúng.
      </p>
      <p>
        <Link
          href={`/sources?workspace=${workspaceId}&project=${projectId}`}
          target="_blank"
          rel="noreferrer"
        >
          Quản lý nguồn trong tab mới ↗
        </Link>
      </p>
      {data.sources.length ? (
        <EvidenceForm
          workspaceId={workspaceId}
          projectId={projectId}
          requirementId={requirementId}
          version={version}
          sources={data.sources}
        />
      ) : (
        <p>Thêm nguồn trong dự án rồi mở lại yêu cầu để chọn đoạn trích.</p>
      )}
      <h3>Các đoạn đã gắn</h3>
      {!data.links.length && (
        <p className="muted">Chưa có đoạn nguồn được gắn.</p>
      )}
      {data.links.map((link) => (
        <article className="source-segment" key={link.id}>
          <span className="eyebrow">
            YÊU CẦU V{link.requirementVersion}
            {link.requirementVersion !== version
              ? " · PHIÊN BẢN TRƯỚC"
              : " · PHIÊN BẢN ĐANG XEM"}
          </span>
          <p>
            <Link
              href={`/sources?workspace=${workspaceId}&project=${projectId}&id=${link.segment.sourceId}#segment-${link.segmentId}`}
              target="_blank"
              rel="noreferrer"
            >
              {link.sourceTitle} · bản nguồn {link.sourceRevision} · dòng{" "}
              {link.segment.line} ↗
            </Link>
          </p>
          <blockquote className="preserve-lines">
            {link.segment.text}
          </blockquote>
        </article>
      ))}
    </section>
  );
}
