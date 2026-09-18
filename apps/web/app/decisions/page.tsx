import Link from "next/link";
import {
  decisionDtoSchema,
  decisionStatusSchema,
  decisionVersionSchema,
  entityIdSchema,
  projectDtoSchema,
  requirementDtoSchema,
} from "@ba/contracts";
import { ApiError, apiRequest } from "@/lib/api";
import { DecisionForm } from "./form";
import { statusLabels } from "./labels";
import { ProjectShell } from "../project-shell";

export const dynamic = "force-dynamic";

export default async function Decisions({
  searchParams,
}: {
  searchParams: Promise<{
    workspace?: string;
    project?: string;
    id?: string;
    view?: string;
    status?: string;
    saved?: string;
    approved?: string;
    superseded?: string;
  }>;
}) {
  const query = await searchParams;
  const workspace = entityIdSchema.safeParse(query.workspace);
  const project = entityIdSchema.safeParse(query.project);
  if (
    !workspace.success ||
    !project.success ||
    (query.id && !entityIdSchema.safeParse(query.id).success) ||
    (query.status && !decisionStatusSchema.safeParse(query.status).success)
  )
    return (
      <main>
        <h1>Đường dẫn chưa hợp lệ.</h1>
        <Link href="/">Về workspace</Link>
      </main>
    );
  const base = `/decisions?workspace=${workspace.data}&project=${project.data}`;
  const api = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [projectData, rows, requirements] = await Promise.all([
      apiRequest(api, projectDtoSchema),
      apiRequest(`${api}/decisions`, decisionDtoSchema.array()),
      apiRequest(`${api}/requirements`, requirementDtoSchema.array()),
    ]);
    const selected = query.id
      ? await apiRequest(`${api}/decisions/${query.id}`, decisionDtoSchema)
      : undefined;
    const history = selected
      ? await apiRequest(
          `${api}/decisions/${selected.id}/versions`,
          decisionVersionSchema.array(),
        )
      : [];
    data = { projectData, rows, requirements, selected, history };
  } catch (error) {
    return (
      <main>
        <section className="error-panel" role="alert">
          <h1>Chưa mở được quyết định.</h1>
          <p>
            {error instanceof ApiError ? error.message : "Vui lòng thử lại."}
          </p>
          <Link href={base}>Thử lại</Link>
        </section>
      </main>
    );
  }
  const { projectData, rows, requirements, selected, history } = data;
  const shown = rows.filter(
    (item) => !query.status || item.status === query.status,
  );
  const replacements = rows.filter(
    (item) => item.status === "APPROVED" && item.id !== selected?.id,
  );
  const superseding = selected?.supersededById
    ? rows.find((item) => item.id === selected.supersededById)
    : undefined;
  return (
    <ProjectShell
      workspaceId={workspace.data}
      project={projectData}
      activeSection="decisions"
      breadcrumbs={[
        { label: "Quyết định", href: selected || query.view === "new" ? base : undefined },
        ...(selected || query.view === "new"
          ? [{ label: selected?.title ?? "Tạo đề xuất" }]
          : []),
      ]}
    >
        <section className="page-heading">
          <div>
            <span className="eyebrow">{projectData.name}</span>
            <h1>Ghi lại quyết định và lý do.</h1>
            <p>
              Giữ rõ người phê duyệt, phạm vi ảnh hưởng và lịch sử thay thế.
            </p>
          </div>
          <Link className="button primary" href={`${base}&view=new`}>
            + Tạo đề xuất
          </Link>
        </section>
        {query.saved === "1" && <p role="status">Đã lưu đề xuất quyết định.</p>}
        {query.approved === "1" && (
          <p role="status">Đã phê duyệt và khóa quyết định.</p>
        )}
        {query.superseded === "1" && (
          <p role="status">Đã ghi nhận quyết định thay thế.</p>
        )}
        {selected || query.view === "new" ? (
          <div className="editor-grid">
            <section>
              {selected && (
                <p className="eyebrow">
                  {selected.code} · {statusLabels[selected.status]} · Phiên bản{" "}
                  {selected.version}
                </p>
              )}
              {superseding && (
                <p>
                  Được thay thế bởi{" "}
                  <Link href={`${base}&id=${superseding.id}`}>
                    {superseding.code} · {superseding.title} ↗
                  </Link>
                </p>
              )}
              <DecisionForm
                key={selected ? `${selected.id}-${selected.version}` : "new"}
                workspaceId={workspace.data}
                projectId={project.data}
                decision={selected}
                requirements={requirements}
                approvedReplacements={replacements}
              />
              {selected?.requirementIds.map((id) => {
                const requirement = requirements.find((item) => item.id === id);
                return (
                  <p key={id}>
                    <Link
                      href={`/requirements?workspace=${workspace.data}&project=${project.data}&id=${id}`}
                    >
                      Mở yêu cầu: {requirement?.title ?? id} ↗
                    </Link>
                  </p>
                );
              })}
            </section>
            <aside>
              <h2>Lịch sử thay đổi</h2>
              {!selected && <p>Lịch sử bắt đầu khi bạn lưu đề xuất.</p>}
              {history.map((version) => (
                <details className="panel" key={version.version}>
                  <summary>
                    Phiên bản {version.version} ·{" "}
                    {statusLabels[version.snapshot.status]}
                  </summary>
                  <p>
                    {new Date(version.createdAt).toLocaleString("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                    })}
                  </p>
                  <strong>{version.snapshot.title}</strong>
                  <p className="preserve-lines">
                    {version.snapshot.description}
                  </p>
                  <p>
                    <strong>Lý do:</strong> {version.snapshot.rationale}
                  </p>
                  <p>
                    {version.snapshot.requirementIds.length} yêu cầu bị ảnh
                    hưởng
                  </p>
                </details>
              ))}
            </aside>
          </div>
        ) : (
          <>
            <form className="project-form panel" method="get">
              <input type="hidden" name="workspace" value={workspace.data} />
              <input type="hidden" name="project" value={project.data} />
              <label htmlFor="decision-status">Trạng thái</label>
              <select
                id="decision-status"
                name="status"
                defaultValue={query.status ?? ""}
              >
                <option value="">Tất cả</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <button className="button secondary">Lọc quyết định</button>
            </form>
            <p className="muted">
              Hiển thị {shown.length} quyết định trong tối đa 100 bản ghi gần
              nhất.
            </p>
            {shown.length ? (
              <div className="project-grid">
                {shown.map((item) => (
                  <Link
                    className="project-card"
                    key={item.id}
                    href={`${base}&id=${item.id}`}
                  >
                    <span className="eyebrow">
                      {item.code} · {statusLabels[item.status]}
                    </span>
                    <h2>{item.title}</h2>
                    <p>{item.requirementIds.length} yêu cầu bị ảnh hưởng</p>
                  </Link>
                ))}
              </div>
            ) : (
              <section className="empty-state">
                <h2>Chưa có quyết định phù hợp.</h2>
                <p>Tạo đề xuất mới hoặc thay đổi bộ lọc.</p>
              </section>
            )}
          </>
        )}
    </ProjectShell>
  );
}
