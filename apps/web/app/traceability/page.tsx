import Link from "next/link";
import { entityIdSchema, projectDtoSchema, traceabilityItemSchema } from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { ProjectShell } from "../project-shell";
export const dynamic = "force-dynamic";
export default async function Traceability({ searchParams }: { searchParams: Promise<{ workspace?: string; project?: string }> }) {
  const query = await searchParams; const workspace = entityIdSchema.safeParse(query.workspace); const project = entityIdSchema.safeParse(query.project);
  if (!workspace.success || !project.success) return <main><h1>Đường dẫn chưa hợp lệ.</h1><Link href="/">Về workspace</Link></main>;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [currentProject, rows] = await Promise.all([apiRequest(apiBase, projectDtoSchema), apiRequest(`${apiBase}/traceability`, traceabilityItemSchema.array())]);
    data = { currentProject, rows };
  } catch (error) { return <main><section className="error-panel"><h1>Chưa mở được truy vết.</h1><p>{error instanceof ApiError ? error.message : "Vui lòng thử lại."}</p></section></main>; }
  const { currentProject, rows } = data;
  return <ProjectShell workspaceId={workspace.data} project={currentProject} activeSection="traceability" breadcrumbs={[{ label: "Truy vết" }]}> 
      <section className="page-heading"><div><span className="eyebrow">CHUỖI BẰNG CHỨNG</span><h1>Yêu cầu đang liên kết với điều gì?</h1><p>Theo dõi nguồn, câu hỏi, quy tắc và quyết định quanh từng yêu cầu.</p></div></section>
      {rows.length ? <div className="project-grid">{rows.map((row) => <Link key={row.requirementId} className="project-card" href={`/requirements?workspace=${workspace.data}&project=${project.data}&id=${row.requirementId}`}>
        <span className="eyebrow">{row.status} · V{row.version}</span><h2>{row.title}</h2>
        <p>{row.sourceCount} nguồn · {row.evidenceCount} đoạn bằng chứng</p><div className="card-footer">{row.questionCount} câu hỏi ({row.openQuestionCount} đang mở) · {row.businessRuleCount} quy tắc · {row.decisionCount} quyết định</div>
      </Link>)}</div> : <section className="empty-state"><h2>Chưa có yêu cầu để truy vết.</h2></section>}
    </ProjectShell>;
}
