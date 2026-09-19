import Link from "next/link";
import { designArtifactSchema, designPreviewSchema, entityIdSchema, projectDtoSchema, requirementDtoSchema } from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { ProjectShell } from "../project-shell";
import { acceptDesign, generateDesign, rejectDesign } from "./actions";
export const dynamic = "force-dynamic";

export default async function DesignStudio({ searchParams }: { searchParams: Promise<{ workspace?: string; project?: string; requirement?: string; generated?: string; reviewed?: string }> }) {
  const query = await searchParams; const workspace = entityIdSchema.safeParse(query.workspace); const project = entityIdSchema.safeParse(query.project); const selectedId = query.requirement ? entityIdSchema.safeParse(query.requirement) : undefined;
  if (!workspace.success || !project.success || (selectedId && !selectedId.success)) return <main><h1>Đường dẫn chưa hợp lệ.</h1><Link href="/">Về workspace</Link></main>;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [currentProject, requirements] = await Promise.all([apiRequest(apiBase, projectDtoSchema), apiRequest(`${apiBase}/requirements`, requirementDtoSchema.array())]);
    const artifacts = selectedId?.success ? await apiRequest(`${apiBase}/requirements/${selectedId.data}/design/artifacts`, designArtifactSchema.array()) : [];
    const preview = selectedId?.success && !artifacts.length ? await apiRequest(`${apiBase}/requirements/${selectedId.data}/design/preview`, designPreviewSchema) : artifacts[0];
    data = { currentProject, requirements, artifacts, preview };
  } catch (error) { return <main><section className="error-panel"><h1>Chưa mở được Design Studio.</h1><p>{error instanceof ApiError ? error.message : "Vui lòng thử lại."}</p></section></main>; }
  const { currentProject, requirements, artifacts, preview } = data; const artifact = artifacts[0]; const base = `/design-studio?workspace=${workspace.data}&project=${project.data}`;
  const hidden = selectedId?.success ? <><input type="hidden" name="workspace" value={workspace.data}/><input type="hidden" name="project" value={project.data}/><input type="hidden" name="requirement" value={selectedId.data}/></> : null;
  return <ProjectShell workspaceId={workspace.data} project={currentProject} activeSection="design-studio" breadcrumbs={[{ label: "Design Studio" }]}> 
    <section className="page-heading"><div><span className="eyebrow">AUTOMATION · INTELLIGENCE · HUMAN REVIEW</span><h1>Từ yêu cầu đến Flow, BPMN và Prototype.</h1><p>Mỗi lần sinh là một proposal có phiên bản. Requirement thay đổi sẽ làm proposal cũ hết hạn và kích hoạt bản mới.</p></div>{selectedId?.success && <form action={generateDesign}>{hidden}<button className="button primary" type="submit">Tạo phiên bản thiết kế</button></form>}</section>
    {query.generated && <p className="success-banner">Đã tạo proposal thiết kế mới.</p>}{query.reviewed && <p className="success-banner">Đã ghi nhận quyết định review.</p>}
    <section className="panel"><h2>Chọn yêu cầu đầu vào</h2><div className="design-picker">{requirements.map((row) => <Link key={row.id} className={`button ${preview?.requirementId === row.id ? "primary" : ""}`} href={`${base}&requirement=${row.id}`}>{row.title}</Link>)}</div></section>
    {!preview ? <section className="empty-state"><h2>Chưa chọn yêu cầu.</h2><p>Design Studio chỉ tạo proposal; không sửa requirement gốc.</p></section> : <>
      <section className="panel design-governance"><div><span className="eyebrow">GOVERNED PROPOSAL</span><p>Requirement V{preview.requirementVersion} · {preview.generatorProfile}</p>{artifact && <strong>{artifact.status} · Design V{artifact.artifactVersion} · {artifact.trigger}</strong>}</div>{artifact?.status === "PENDING_REVIEW" && <div className="review-actions"><form action={rejectDesign}>{hidden}<input type="hidden" name="artifact" value={artifact.id}/><input type="hidden" name="revision" value={artifact.revision}/><button className="button" type="submit">Từ chối</button></form><form action={acceptDesign}>{hidden}<input type="hidden" name="artifact" value={artifact.id}/><input type="hidden" name="revision" value={artifact.revision}/><button className="button primary" type="submit">Chấp nhận</button></form></div>}</section>
      <section className="panel"><span className="eyebrow">FLOW DRAFT</span><h2>{preview.flow.title}</h2><div className="flow-canvas">{preview.flow.nodes.map((node, index) => <div className="flow-step" key={node.id}><span>{node.kind}</span><strong>{node.label}</strong>{index < preview.flow.nodes.length - 1 && <b aria-hidden="true">↓</b>}</div>)}</div></section>
      <section className="panel"><span className="eyebrow">BPMN DRAFT</span><h2>{preview.bpmn.title}</h2><div className="bpmn-board">{preview.bpmn.lanes.map((lane) => <div className="bpmn-lane" key={lane.name}><strong>{lane.name}</strong><div>{lane.activities.map((activity, index) => <span key={`${activity}-${index}`}>{activity}</span>)}</div></div>)}</div></section>
      <section className="panel"><span className="eyebrow">PROTOTYPE DRAFT</span><h2>{preview.prototype.title}</h2><div className="prototype-grid">{preview.prototype.screens.map((screen) => <article className="prototype-screen" key={screen.name}><span className="eyebrow">SCREEN</span><h3>{screen.name}</h3><p>{screen.purpose}</p>{screen.elements.map((element, index) => <div className="prototype-element" key={`${element}-${index}`}>{element}</div>)}</article>)}</div></section>
      {!!artifacts.length && <section className="panel"><h2>Lịch sử thiết kế</h2><div className="history-list">{artifacts.map((item) => <article key={item.id}><strong>Design V{item.artifactVersion}</strong><span>{item.status} · Requirement V{item.requirementVersion} · {item.generatorProfile}</span></article>)}</div></section>}
    </>}
  </ProjectShell>;
}
