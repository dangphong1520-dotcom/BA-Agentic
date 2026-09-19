import Link from "next/link";
import { designPreviewSchema, entityIdSchema, projectDtoSchema, requirementDtoSchema } from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { ProjectShell } from "../project-shell";
export const dynamic = "force-dynamic";

export default async function DesignStudio({ searchParams }: { searchParams: Promise<{ workspace?: string; project?: string; requirement?: string }> }) {
  const query = await searchParams;
  const workspace = entityIdSchema.safeParse(query.workspace); const project = entityIdSchema.safeParse(query.project);
  const selectedId = query.requirement ? entityIdSchema.safeParse(query.requirement) : undefined;
  if (!workspace.success || !project.success || (selectedId && !selectedId.success)) return <main><h1>Đường dẫn chưa hợp lệ.</h1><Link href="/">Về workspace</Link></main>;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [currentProject, requirements] = await Promise.all([apiRequest(apiBase, projectDtoSchema), apiRequest(`${apiBase}/requirements`, requirementDtoSchema.array())]);
    const preview = selectedId?.success ? await apiRequest(`${apiBase}/requirements/${selectedId.data}/design-preview`, designPreviewSchema) : undefined;
    data = { currentProject, requirements, preview };
  } catch (error) { return <main><section className="error-panel"><h1>Chưa mở được Design Studio.</h1><p>{error instanceof ApiError ? error.message : "Vui lòng thử lại."}</p></section></main>; }
  const { currentProject, requirements, preview } = data;
  const base = `/design-studio?workspace=${workspace.data}&project=${project.data}`;
  return <ProjectShell workspaceId={workspace.data} project={currentProject} activeSection="design-studio" breadcrumbs={[{ label: "Design Studio" }]}> 
    <section className="page-heading"><div><span className="eyebrow">AUTOMATION · PROPOSAL</span><h1>Từ yêu cầu đến Flow, BPMN và Prototype.</h1><p>Chọn một yêu cầu để hệ thống tự dựng ba bản nháp có truy vết. BA vẫn là người review và quyết định.</p></div></section>
    <section className="panel"><h2>Chọn yêu cầu đầu vào</h2><div className="design-picker">{requirements.map((row) => <Link key={row.id} className={`button ${preview?.requirementId === row.id ? "primary" : ""}`} href={`${base}&requirement=${row.id}`}>{row.title}</Link>)}</div></section>
    {!preview ? <section className="empty-state"><h2>Chưa chọn yêu cầu.</h2><p>Design Studio chỉ tạo proposal; không sửa requirement gốc.</p></section> : <>
      <p className="muted">PROPOSAL · Requirement V{preview.requirementVersion} · {preview.generatorProfile}</p>
      <section className="panel"><span className="eyebrow">FLOW DRAFT</span><h2>{preview.flow.title}</h2><div className="flow-canvas">{preview.flow.nodes.map((node, index) => <div className="flow-step" key={node.id}><span>{node.kind}</span><strong>{node.label}</strong>{index < preview.flow.nodes.length - 1 && <b aria-hidden="true">↓</b>}</div>)}</div></section>
      <section className="panel"><span className="eyebrow">BPMN DRAFT</span><h2>{preview.bpmn.title}</h2><div className="bpmn-board">{preview.bpmn.lanes.map((lane) => <div className="bpmn-lane" key={lane.name}><strong>{lane.name}</strong><div>{lane.activities.map((activity) => <span key={activity}>{activity}</span>)}</div></div>)}</div></section>
      <section className="panel"><span className="eyebrow">PROTOTYPE DRAFT</span><h2>{preview.prototype.title}</h2><div className="prototype-grid">{preview.prototype.screens.map((screen) => <article className="prototype-screen" key={screen.name}><span className="eyebrow">SCREEN</span><h3>{screen.name}</h3><p>{screen.purpose}</p>{screen.elements.map((element) => <div className="prototype-element" key={element}>{element}</div>)}</article>)}</div></section>
    </>}
  </ProjectShell>;
}
