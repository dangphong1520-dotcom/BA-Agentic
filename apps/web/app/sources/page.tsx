import Link from "next/link";
import {
  entityIdSchema,
  projectDtoSchema,
  sourceDtoSchema,
} from "@ba/contracts";
import { ApiError, apiRequest } from "@/lib/api";
import { SourceForm } from "./forms";
export const dynamic = "force-dynamic";
export default async function Sources({
  searchParams,
}: {
  searchParams: Promise<{
    workspace?: string;
    project?: string;
    id?: string;
    view?: string;
  }>;
}) {
  const q = await searchParams;
  const workspace = entityIdSchema.safeParse(q.workspace);
  const project = entityIdSchema.safeParse(q.project);
  if (
    !workspace.success ||
    !project.success ||
    (q.id && !entityIdSchema.safeParse(q.id).success)
  )
    return (
      <main>
        <h1>Đường dẫn chưa hợp lệ.</h1>
        <Link href="/">Về workspace</Link>
      </main>
    );
  const base = `/sources?workspace=${workspace.data}&project=${project.data}`;
  const apiBase = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const currentProject = await apiRequest(apiBase, projectDtoSchema);
    const sources = await apiRequest(
      `${apiBase}/sources`,
      sourceDtoSchema.array(),
    );
    const source = q.id
      ? await apiRequest(`${apiBase}/sources/${q.id}`, sourceDtoSchema)
      : undefined;
    data = { currentProject, sources, source };
  } catch (error) {
    return (
      <main>
        <section className="error-panel" role="alert">
          <h1>Chưa mở được nguồn.</h1>
          <p>
            {error instanceof ApiError ? error.message : "Vui lòng thử lại."}
          </p>
          <Link href={base}>Thử lại</Link>
        </section>
      </main>
    );
  }
  const { currentProject, sources, source } = data;
  return (
    <div className="requirements-shell">
      <header className="topbar">
        <Link href="/">BA Agent · Workspace</Link>
        <Link href={`/?workspace=${workspace.data}&project=${project.data}`}>
          {currentProject.name}
        </Link>
      </header>
      <main>
        <nav className="breadcrumb">
          <Link href={base}>Nguồn thông tin</Link>
          <Link
            href={`/requirements?workspace=${workspace.data}&project=${project.data}`}
          >
            Yêu cầu nghiệp vụ
          </Link>
        </nav>
        <section className="page-heading">
          <div>
            <span className="eyebrow">{currentProject.name}</span>
            <h1>
              {source?.title ??
                (q.view === "new"
                  ? "Giữ lại nguồn gốc."
                  : "Căn cứ cho phân tích.")}
            </h1>
            <p>
              Lưu văn bản gốc và truy lại từng đoạn được sử dụng trong yêu cầu.
            </p>
          </div>
          <Link className="button primary" href={`${base}&view=new`}>
            + Thêm nguồn
          </Link>
        </section>
        {source ? (
          <section className="panel">
            <p className="eyebrow">BẢN NGUỒN 1 · NỘI DUNG ĐƯỢC GIỮ NGUYÊN</p>
            <details>
              <summary>Xem toàn bộ văn bản gốc</summary>
              <pre className="preserve-lines">{source.content}</pre>
            </details>
            <h2>Các đoạn nguồn</h2>
            {source.segments.map((segment) => (
              <article
                key={segment.id}
                id={`segment-${segment.id}`}
                className="source-segment"
              >
                <strong>Dòng {segment.line}</strong>
                <p className="preserve-lines">{segment.text}</p>
              </article>
            ))}
          </section>
        ) : q.view === "new" ? (
          <SourceForm workspaceId={workspace.data} projectId={project.data} />
        ) : sources.length ? (
          <div className="project-grid">
            {sources.map((row) => (
              <Link
                className="project-card"
                key={row.id}
                href={`${base}&id=${row.id}`}
              >
                <span className="eyebrow">
                  {row.segments.length} ĐOẠN NGUỒN
                </span>
                <h2>{row.title}</h2>
                <p>{row.content.slice(0, 180)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <section className="empty-state">
            <h2>Dự án chưa có nguồn.</h2>
            <p>
              Bắt đầu với ghi chép cuộc họp, email hoặc văn bản bạn muốn dùng
              làm căn cứ.
            </p>
            <Link className="button primary" href={`${base}&view=new`}>
              Thêm nguồn đầu tiên
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
