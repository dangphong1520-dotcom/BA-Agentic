import Link from "next/link";
import {
  entityIdSchema,
  projectDtoSchema,
  requirementDtoSchema,
  requirementVersionSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { RequirementForm } from "./form";
import { typeLabels, priorityLabels, textFields } from "./labels";
export const dynamic = "force-dynamic";
export default async function Requirements({
  searchParams,
}: {
  searchParams: Promise<{
    workspace?: string;
    project?: string;
    id?: string;
    view?: string;
    saved?: string;
  }>;
}) {
  const query = await searchParams;
  const workspace = entityIdSchema.safeParse(query.workspace);
  const project = entityIdSchema.safeParse(query.project);
  if (
    !workspace.success ||
    !project.success ||
    (query.id && !entityIdSchema.safeParse(query.id).success)
  )
    return (
      <main>
        <h1>Đường dẫn chưa hợp lệ.</h1>
        <Link href="/">Về workspace</Link>
      </main>
    );
  const base = `/requirements?workspace=${workspace.data}&project=${project.data}`;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const currentProject = await apiRequest(apiBase, projectDtoSchema);
    const requirements = await apiRequest(
      `${apiBase}/requirements`,
      requirementDtoSchema.array(),
    );
    const selected = query.id
      ? await apiRequest(
          `${apiBase}/requirements/${query.id}`,
          requirementDtoSchema,
        )
      : undefined;
    const versions = selected
      ? await apiRequest(
          `${apiBase}/requirements/${selected.id}/versions`,
          requirementVersionSchema.array(),
        )
      : [];
    data = { currentProject, requirements, selected, versions };
  } catch (error) {
    return (
      <main>
        <section className="error-panel" role="alert">
          <h1>Chưa mở được yêu cầu.</h1>
          <p>
            {error instanceof ApiError ? error.message : "Vui lòng thử lại."}
          </p>
          <Link href={base}>Thử lại</Link>
          <p>
            <Link href="/">Về workspace</Link>
          </p>
        </section>
      </main>
    );
  }
  const { currentProject, requirements, selected, versions } = data;
  const editing = selected || query.view === "new";
  return (
    <div className="requirements-shell">
      <header className="topbar">
        <Link href="/">BA Agent · Workspace</Link>
        <Link href={`/?workspace=${workspace.data}&project=${project.data}`}>
          {currentProject.name}
        </Link>
      </header>
      <main id="main-content">
        <nav className="breadcrumb">
          <Link href={base}>Yêu cầu nghiệp vụ</Link>
          {editing && <span>/ {selected ? "Chi tiết" : "Tạo bản nháp"}</span>}
        </nav>
        <section className="page-heading">
          <div>
            <span className="eyebrow">{currentProject.name}</span>
            <h1>
              {selected?.title ??
                (editing ? "Làm rõ một yêu cầu." : "Từ ý tưởng đến yêu cầu.")}
            </h1>
            <p>
              {editing
                ? "Ghi lại điều đã biết, giữ rõ những điểm cần xác minh."
                : "Quản lý bản nháp và giữ lịch sử thay đổi trong dự án."}
            </p>
          </div>
          {!editing && (
            <Link className="button primary" href={`${base}&view=new`}>
              + Tạo yêu cầu
            </Link>
          )}
        </section>
        {editing ? (
          <div className="editor-grid">
            <section className="panel">
              <RequirementForm
                key={selected ? `${selected.id}-${selected.version}` : "new"}
                workspaceId={workspace.data}
                projectId={project.data}
                requirement={selected}
              />
            </section>
            <aside className="requirement-history">
              <h2>Lịch sử phiên bản</h2>
              <p className="muted">Các bản đã lưu được giữ lại để đối chiếu.</p>
              {!selected && <p>Phiên bản đầu tiên được tạo khi bạn lưu.</p>}
              {versions.map((version) => (
                <details key={version.version} className="panel">
                  <summary>
                    Phiên bản {version.version} ·{" "}
                    {new Date(version.createdAt).toLocaleString("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                    })}
                  </summary>
                  <h3>{version.snapshot.title}</h3>
                  <p>
                    {typeLabels[version.snapshot.type]} ·{" "}
                    {priorityLabels[version.snapshot.priority]}
                  </p>
                  {textFields.map(([key, label]) => (
                    <div key={key}>
                      <strong>{label}</strong>
                      <p className="preserve-lines">
                        {version.snapshot[key] || "Chưa ghi nhận"}
                      </p>
                    </div>
                  ))}
                </details>
              ))}
            </aside>
          </div>
        ) : requirements.length ? (
          <div className="project-grid">
            {requirements.map((row) => (
              <Link
                key={row.id}
                className="project-card"
                href={`${base}&id=${row.id}`}
              >
                <span className="eyebrow">BẢN NHÁP · V{row.version}</span>
                <h2>{row.title}</h2>
                <p>{row.description || "Chưa có mô tả"}</p>
                <div className="card-footer">
                  {typeLabels[row.type]} · {priorityLabels[row.priority]}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <span className="eyebrow">BƯỚC TIẾP THEO</span>
            <h2>Dự án chưa có yêu cầu.</h2>
            <p>Bắt đầu với một nhu cầu hoặc hành vi hệ thống cần làm rõ.</p>
            <Link className="button primary" href={`${base}&view=new`}>
              Tạo yêu cầu đầu tiên
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
