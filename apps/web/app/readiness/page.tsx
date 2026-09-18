import Link from "next/link";
import { entityIdSchema, projectDtoSchema, readinessPortfolioSchema } from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { ProjectShell } from "../project-shell";
export const dynamic = "force-dynamic";
const labels: Record<string, string> = { READY: "Sẵn sàng", CONDITIONAL: "Sẵn sàng có điều kiện", NOT_READY: "Chưa sẵn sàng" };
const checkLabels: Record<string, string> = { DESCRIPTION: "Mô tả", BUSINESS_GOAL: "Mục tiêu", ACTOR: "Actor", MAIN_FLOW: "Luồng chính", ACCEPTANCE_CRITERIA: "Tiêu chí chấp nhận", SOURCE_EVIDENCE: "Bằng chứng", BLOCKING_QUESTIONS: "Câu hỏi chặn" };
export default async function Readiness({ searchParams }: { searchParams: Promise<{ workspace?: string; project?: string }> }) {
  const query = await searchParams; const workspace = entityIdSchema.safeParse(query.workspace); const project = entityIdSchema.safeParse(query.project);
  if (!workspace.success || !project.success) return <main><h1>Đường dẫn chưa hợp lệ.</h1><Link href="/">Về workspace</Link></main>;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [currentProject, portfolio] = await Promise.all([apiRequest(apiBase, projectDtoSchema), apiRequest(`${apiBase}/readiness-portfolio`, readinessPortfolioSchema)]);
    data = { currentProject, portfolio };
  } catch (error) { return <main><section className="error-panel"><h1>Chưa mở được tổng quan.</h1><p>{error instanceof ApiError ? error.message : "Vui lòng thử lại."}</p></section></main>; }
  const { currentProject, portfolio } = data;
  return <ProjectShell workspaceId={workspace.data} project={currentProject} activeSection="readiness" breadcrumbs={[{ label: "Sẵn sàng dự án" }]}> 
      <section className="page-heading"><div><span className="eyebrow">TỔNG QUAN CHẤT LƯỢNG</span><h1>Ưu tiên yêu cầu cần hoàn thiện.</h1><p>Đánh giá mang tính tư vấn; BA vẫn quyết định trạng thái và phê duyệt.</p></div></section>
      <div className="project-grid"><article className="project-card"><span className="eyebrow">TỔNG YÊU CẦU</span><h2>{portfolio.total}</h2><p>{portfolio.ready} sẵn sàng · {portfolio.conditional} có điều kiện · {portfolio.notReady} chưa sẵn sàng</p></article></div>
      {portfolio.items.length ? <div className="project-grid">{portfolio.items.map((item) => <Link key={item.requirementId} className="project-card" href={`/requirements?workspace=${workspace.data}&project=${project.data}&id=${item.requirementId}`}>
        <span className="eyebrow">{labels[item.readinessStatus]} · {item.lifecycleStatus}</span><h2>{item.title}</h2><p>{item.failedChecks.length ? `Cần bổ sung: ${item.failedChecks.map((check) => checkLabels[check.key]).join(", ")}` : "Đã vượt qua toàn bộ kiểm tra hiện tại."}</p><div className="card-footer">Phiên bản {item.version} · Mở chi tiết để xử lý</div>
      </Link>)}</div> : <section className="empty-state"><h2>Chưa có yêu cầu để đánh giá.</h2></section>}
    </ProjectShell>;
}
