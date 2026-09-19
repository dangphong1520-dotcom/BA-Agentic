import Link from "next/link";
import { redirect } from "next/navigation";
import { documentFormatSchema, documentPreviewSchema, entityIdSchema, projectDtoSchema, workspaceDtoSchema, type DocumentFormat } from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { ProjectShell } from "../project-shell";
export const dynamic = "force-dynamic";
const labels: Record<DocumentFormat, string> = { BRD: "Business Requirements Document", PRD: "Product Requirements Document", SRS: "Software Requirements Specification" };

export default async function Documents({ searchParams }: { searchParams: Promise<{ workspace?: string; project?: string; format?: string }> }) {
  const query = await searchParams;
  if (!query.workspace || !query.project) {
    let destination = "/";
    try { const workspaces = await apiRequest("/workspaces", workspaceDtoSchema.array()); const workspace = workspaces[0]; if (workspace) { const projects = await apiRequest(`/workspaces/${workspace.id}/projects`, projectDtoSchema.array()); destination = projects[0] ? `/documents?workspace=${workspace.id}&project=${projects[0].id}&format=BRD` : `/?workspace=${workspace.id}`; } } catch { destination = "/"; }
    redirect(destination);
  }
  const workspace = entityIdSchema.safeParse(query.workspace); const project = entityIdSchema.safeParse(query.project); const format = documentFormatSchema.safeParse(query.format ?? "BRD");
  if (!workspace.success || !project.success || !format.success) return <main><h1>Đường dẫn tài liệu chưa hợp lệ.</h1><Link href="/">Về workspace</Link></main>;
  const base = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try { data = await Promise.all([apiRequest(base, projectDtoSchema), apiRequest(`${base}/documents/${format.data}/preview`, documentPreviewSchema)]); }
  catch (error) { return <main><section className="error-panel"><h1>Chưa tạo được tài liệu.</h1><p>{error instanceof ApiError ? error.message : "Vui lòng thử lại."}</p></section></main>; }
  const [currentProject, document] = data; const route = `/documents?workspace=${workspace.data}&project=${project.data}`;
  const markdown = `# ${document.title}\n\n> ${document.classification} · ${document.generatorProfile}\n\n${document.sections.map((section) => `## ${section.heading}\n\n${section.content}`).join("\n\n")}`;
  return <ProjectShell workspaceId={workspace.data} project={currentProject} activeSection="documents" breadcrumbs={[{ label: "Tài liệu tự động" }]}>
    <section className="page-heading"><div><span className="eyebrow">DOCUMENT GENERATOR · PROPOSAL</span><h1>Tạo tài liệu BA từ tri thức dự án.</h1><p>Chọn format; hệ thống tổng hợp đúng phiên bản requirement hiện có và giữ rõ các phần chưa xác định.</p></div><a className="button primary" href={`data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`} download={`${format.data}-${currentProject.name}.md`}>Tải Markdown ↓</a></section>
    <section className="panel"><h2>Format tài liệu</h2><div className="design-picker">{documentFormatSchema.options.map((item) => <Link key={item} className={`button ${item === format.data ? "primary" : ""}`} href={`${route}&format=${item}`}>{item} · {labels[item]}</Link>)}</div></section>
    <section className="panel document-preview"><div className="document-cover"><span className="eyebrow">{document.classification}</span><h2>{document.title}</h2><p>{document.requirementVersions.length} requirement versions · {document.generatorProfile}</p></div>{document.sections.map((section) => <article key={section.heading}><h3>{section.heading}</h3><pre>{section.content}</pre></article>)}</section>
  </ProjectShell>;
}
