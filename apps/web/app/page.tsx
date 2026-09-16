import Link from "next/link";
import {
  entityIdSchema,
  projectDtoSchema,
  workspaceDtoSchema,
} from "@ba/contracts";
import type { ProjectDto, WorkspaceDto } from "@ba/contracts";
import { ApiError, apiRequest } from "@/lib/api";
import { ProjectForm, WorkspaceForm } from "./forms";

export const dynamic = "force-dynamic";
function date(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    workspace?: string;
    project?: string;
    view?: string;
    notice?: string;
  }>;
}) {
  const query = await searchParams;
  let workspaces: WorkspaceDto[] = [];
  let projects: ProjectDto[] = [];
  let workspace: WorkspaceDto | undefined;
  let project: ProjectDto | undefined;
  let error: string | undefined;
  try {
    workspaces = await apiRequest("/workspaces", workspaceDtoSchema.array());
    if (query.workspace && !entityIdSchema.safeParse(query.workspace).success)
      throw new ApiError(400, "Đường dẫn workspace không hợp lệ.");
    workspace = query.workspace
      ? workspaces.find((item) => item.id === query.workspace)
      : workspaces[0];
    if (query.workspace && !workspace)
      throw new ApiError(
        404,
        "Workspace không tồn tại hoặc bạn không có quyền truy cập.",
      );
    if (workspace)
      projects = await apiRequest(
        `/workspaces/${workspace.id}/projects`,
        projectDtoSchema.array(),
      );
    if (query.project) {
      if (!workspace || !entityIdSchema.safeParse(query.project).success)
        throw new ApiError(400, "Đường dẫn dự án không hợp lệ.");
      project = await apiRequest(
        `/workspaces/${workspace.id}/projects/${query.project}`,
        projectDtoSchema,
      );
    }
  } catch (caught) {
    error =
      caught instanceof ApiError
        ? caught.message
        : "Chưa tải được dữ liệu. Vui lòng thử lại.";
  }
  const editing = project || query.view === "new";
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            ba<span>·</span>
          </span>
          <span>
            BA Agent<span className="brand-caption">WORKSPACE</span>
          </span>
        </Link>
        <div className="workspace-heading">
          <span className="eyebrow">KHÔNG GIAN LÀM VIỆC</span>
          <span className="tiny-count">{workspaces.length}</span>
        </div>
        <nav aria-label="Workspace" className="workspace-nav">
          {workspaces.map((item) => (
            <Link
              key={item.id}
              href={`/?workspace=${item.id}`}
              className={`workspace-link ${item.id === workspace?.id ? "selected" : ""}`}
              aria-current={item.id === workspace?.id ? "page" : undefined}
            >
              <span className="workspace-icon">
                {item.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{item.name}</span>
              <span aria-hidden="true">⌄</span>
            </Link>
          ))}
        </nav>
        {!error && (
          <details className="new-workspace" open={workspaces.length === 0}>
            <summary>+ Tạo workspace mới</summary>
            <WorkspaceForm />
          </details>
        )}
        <div className="side-divider" />
        <Link
          href={workspace ? `/?workspace=${workspace.id}` : "/"}
          className="side-active"
        >
          <span aria-hidden="true">▦</span> Dự án{" "}
          <span className="tiny-count">{projects.length}</span>
        </Link>
        <div className="sidebar-note">
          <span className="note-star" aria-hidden="true">
            ✳
          </span>
          <p>
            Bắt đầu từ bối cảnh.
            <br />
            <strong>Xây dựng sự rõ ràng.</strong>
          </p>
          <span className="muted small">
            Một không gian cho công việc BA của bạn.
          </span>
        </div>
        <div className="profile">
          <span className="avatar">BA</span>
          <div>
            Business Analyst
            <span className="muted small">Phiên cá nhân · Phát triển</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="muted">Không gian làm việc</span>
            <span className="slash">/</span>
            <span>{workspace?.name ?? "Bắt đầu"}</span>
          </div>
          <span className="topbar-label">
            BA AGENT PLATFORM <span aria-hidden="true">✳</span>
          </span>
        </header>
        <main id="main-content">
          <div className="breadcrumb">
            <Link href={workspace ? `/?workspace=${workspace.id}` : "/"}>
              Dự án
            </Link>
            {editing && (
              <>
                <span>/</span>
                <span>{project ? "Thông tin dự án" : "Tạo dự án"}</span>
              </>
            )}
          </div>
          {error ? (
            <section className="error-panel full-error" role="alert">
              <span className="eyebrow">CHƯA THỂ MỞ KHÔNG GIAN</span>
              <h1>Cùng kết nối lại.</h1>
              <p>{error}</p>
              <Link href="/" className="button primary">
                Thử lại
              </Link>
            </section>
          ) : (
            <>
              <section className="page-heading">
                <div>
                  <span className="eyebrow">
                    {editing ? workspace?.name : "TỪ BỐI CẢNH ĐẾN YÊU CẦU"}
                  </span>
                  <h1>
                    {project?.name ??
                      (query.view === "new"
                        ? "Khởi đầu một dự án."
                        : "Không gian cho ý tưởng rõ ràng.")}
                  </h1>
                  <p>
                    {editing
                      ? "Xác định mục tiêu và phạm vi để mọi phân tích đi cùng một hướng."
                      : "Tập hợp bối cảnh, xác định mục tiêu và bắt đầu công việc phân tích."}
                  </p>
                </div>
                {workspace && !editing && (
                  <Link
                    className="button primary"
                    href={`/?workspace=${workspace.id}&view=new`}
                  >
                    + Tạo dự án
                  </Link>
                )}
              </section>
              {query.notice === "saved" && (
                <p className="success-message" role="status">
                  ✓ Đã lưu thông tin dự án.
                </p>
              )}
              {query.notice === "workspace-created" && (
                <p className="success-message" role="status">
                  ✓ Workspace đã sẵn sàng. Hãy bắt đầu với dự án đầu tiên.
                </p>
              )}
              {editing && workspace ? (
                <>
                  {project && (
                    <p>
                      <Link
                        className="button primary"
                        href={`/requirements?workspace=${workspace.id}&project=${project.id}`}
                      >
                        Yêu cầu nghiệp vụ ↗
                      </Link>{" "}
                      <Link
                        className="button secondary"
                        href={`/sources?workspace=${workspace.id}&project=${project.id}`}
                      >
                        Nguồn thông tin ↗
                      </Link>
                      {" "}<Link className="button secondary" href={`/questions?workspace=${workspace.id}&project=${project.id}`}>Câu hỏi làm rõ ↗</Link>
                    </p>
                  )}
                  <div className="editor-grid">
                    <section className="panel">
                      <ProjectForm
                        key={
                          project
                            ? `${project.id}-${project.version}`
                            : `new-${workspace.id}`
                        }
                        workspaceId={workspace.id}
                        project={project}
                      />
                    </section>
                    <aside className="editor-note">
                      <span className="note-star" aria-hidden="true">
                        ✳
                      </span>
                      <h2>
                        Bối cảnh tốt.
                        <br />
                        Phân tích tốt hơn.
                      </h2>
                      <p>
                        Chưa cần có mọi câu trả lời. Bắt đầu bằng điều bạn đã
                        biết và ghi rõ những điểm cần làm sáng tỏ.
                      </p>
                      <div className="note-rule" />
                      <span className="eyebrow">GỢI Ý CHO BẠN</span>
                      <ol>
                        <li>Vấn đề cần giải quyết là gì?</li>
                        <li>Ai là người hưởng lợi?</li>
                        <li>Kết quả nào có thể đo lường?</li>
                      </ol>
                      {project && (
                        <div className="project-meta">
                          Phiên bản {project.version}
                          <br />
                          Cập nhật {date(project.updatedAt)}
                        </div>
                      )}
                    </aside>
                  </div>
                </>
              ) : !workspace ? (
                <section className="empty-state">
                  <div className="empty-art" aria-hidden="true">
                    <span>01</span>
                    <div />
                    <div />
                  </div>
                  <span className="eyebrow">BƯỚC ĐẦU TIÊN</span>
                  <h2>Tạo nơi bắt đầu của bạn.</h2>
                  <p>
                    Một workspace giúp bạn nhóm các dự án và giữ bối cảnh công
                    việc ở cùng một nơi.
                  </p>
                  <a className="button secondary" href="#workspace-name">
                    Đặt tên workspace <span aria-hidden="true">↗</span>
                  </a>
                </section>
              ) : (
                <>
                  <div className="list-heading">
                    <h2>
                      Dự án của bạn{" "}
                      <span className="count-pill">{projects.length}</span>
                    </h2>
                    <span className="muted small">
                      {projects.length
                        ? "Những dự án bạn có quyền truy cập"
                        : "Sẵn sàng cho khởi đầu mới"}
                    </span>
                  </div>
                  {projects.length ? (
                    <div className="project-grid">
                      {projects.map((item, index) => (
                        <Link
                          key={item.id}
                          className="project-card"
                          href={`/?workspace=${workspace.id}&project=${item.id}`}
                        >
                          <div className="card-top">
                            <span className="project-icon" aria-hidden="true">
                              ▦
                            </span>
                            <span className="card-number">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <h3>{item.name}</h3>
                          <p>
                            {item.businessGoal ||
                              item.description ||
                              "Bổ sung mục tiêu và bối cảnh để bắt đầu phân tích."}
                          </p>
                          <div className="card-footer">
                            <span>Cập nhật {date(item.updatedAt)}</span>
                            <span className="card-arrow" aria-hidden="true">
                              ↗
                            </span>
                          </div>
                        </Link>
                      ))}
                      <Link
                        href={`/?workspace=${workspace.id}&view=new`}
                        className="new-project-card"
                      >
                        <span aria-hidden="true">+</span>
                        <strong>Một dự án mới</strong>
                        <p>Bắt đầu từ một vấn đề cần giải quyết.</p>
                      </Link>
                    </div>
                  ) : (
                    <section className="empty-state">
                      <div className="empty-art" aria-hidden="true">
                        <span>01</span>
                        <div />
                        <div />
                      </div>
                      <span className="eyebrow">
                        MỌI DỰ ÁN ĐỀU BẮT ĐẦU TỪ MỘT CÂU HỎI
                      </span>
                      <h2>Bạn muốn giải quyết điều gì?</h2>
                      <p>
                        Tạo dự án đầu tiên, ghi lại mục tiêu và xây dựng nền
                        tảng cho các yêu cầu tiếp theo.
                      </p>
                      <Link
                        className="button primary"
                        href={`/?workspace=${workspace.id}&view=new`}
                      >
                        Tạo dự án đầu tiên <span aria-hidden="true">↗</span>
                      </Link>
                    </section>
                  )}
                </>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>Rõ bối cảnh. Giữ kết nối. Tạo giá trị.</span>
            <span>
              BA Agent <span aria-hidden="true">✳</span>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
