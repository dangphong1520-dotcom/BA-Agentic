import Link from "next/link";
import { entityIdSchema, findingRegisterItemSchema, projectDtoSchema } from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { ProjectShell } from "../project-shell";
export const dynamic = "force-dynamic";

const typeLabels: Record<string, string> = {
  MISSING_INFORMATION: "Thiếu thông tin", AMBIGUITY: "Mơ hồ", CONFLICT: "Xung đột",
  DEPENDENCY: "Phụ thuộc", QUALITY_ISSUE: "Chất lượng", TRACEABILITY_GAP: "Thiếu truy vết",
  RECOMMENDATION: "Khuyến nghị",
};
export default async function Findings({ searchParams }: { searchParams: Promise<{ workspace?: string; project?: string }> }) {
  const query = await searchParams;
  const workspace = entityIdSchema.safeParse(query.workspace); const project = entityIdSchema.safeParse(query.project);
  if (!workspace.success || !project.success) return <main><h1>Đường dẫn chưa hợp lệ.</h1><Link href="/">Về workspace</Link></main>;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [currentProject, findings] = await Promise.all([
      apiRequest(apiBase, projectDtoSchema), apiRequest(`${apiBase}/findings`, findingRegisterItemSchema.array()),
    ]);
    data = { currentProject, findings };
  } catch (error) { return <main><section className="error-panel"><h1>Chưa mở được phát hiện.</h1><p>{error instanceof ApiError ? error.message : "Vui lòng thử lại."}</p></section></main>; }
  const { currentProject, findings } = data;
  return <ProjectShell workspaceId={workspace.data} project={currentProject} activeSection="findings" breadcrumbs={[{ label: "Phát hiện phân tích" }]}> 
      <section className="page-heading"><div><span className="eyebrow">TRI THỨC CẦN RÀ SOÁT</span><h1>Phát hiện từ các lần phân tích.</h1><p>Mọi phát hiện vẫn giữ phân loại, độ tin cậy và nguồn phát sinh để BA tự đánh giá.</p></div></section>
      {findings.length ? <div className="project-grid">{findings.map((item) => <Link key={item.id} className="project-card" href={`/sources?workspace=${workspace.data}&project=${project.data}&id=${item.sourceId}`}>
        <span className="eyebrow">{typeLabels[item.type] ?? item.type} · {item.classification}</span><h2>{item.sourceTitle}</h2><p>{item.description}</p>
        <div className="card-footer">Tin cậy {Math.round(item.confidence * 100)}% · {item.evidenceCount} bằng chứng · {item.reviewStatus}</div>
      </Link>)}</div> : <section className="empty-state"><h2>Chưa có phát hiện.</h2><p>Phân tích một nguồn để tạo phát hiện có cấu trúc.</p></section>}
    </ProjectShell>;
}
