import Link from "next/link";
import {
  entityIdSchema,
  projectDtoSchema,
  questionDtoSchema,
  questionVersionSchema,
  requirementDtoSchema,
  questionStatusSchema,
} from "@ba/contracts";
import { apiRequest, ApiError } from "@/lib/api";
import { QuestionForm } from "./form";
import { categoryLabels, priorityLabels, statusLabels } from "./labels";
export const dynamic = "force-dynamic";
export default async function Questions({
  searchParams,
}: {
  searchParams: Promise<{
    workspace?: string;
    project?: string;
    id?: string;
    view?: string;
    requirement?: string;
    status?: string;
    blocking?: string;
    saved?: string;
  }>;
}) {
  const q = await searchParams;
  const workspace = entityIdSchema.safeParse(q.workspace),
    project = entityIdSchema.safeParse(q.project);
  if (
    !workspace.success ||
    !project.success ||
    (q.id && !entityIdSchema.safeParse(q.id).success) ||
    (q.requirement && !entityIdSchema.safeParse(q.requirement).success) ||
    (q.status && !questionStatusSchema.safeParse(q.status).success)
  )
    return (
      <main>
        <h1>Đường dẫn chưa hợp lệ.</h1>
        <Link href="/">Về workspace</Link>
      </main>
    );
  const base = `/questions?workspace=${workspace.data}&project=${project.data}`;
  const api = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [projectData, rows, requirements] = await Promise.all([
      apiRequest(api, projectDtoSchema),
      apiRequest(`${api}/questions`, questionDtoSchema.array()),
      apiRequest(`${api}/requirements`, requirementDtoSchema.array()),
    ]);
    const selected = q.id
      ? await apiRequest(`${api}/questions/${q.id}`, questionDtoSchema)
      : undefined;
    const linkedId = selected?.requirementId ?? q.requirement;
    if (linkedId && !requirements.some((r) => r.id === linkedId))
      requirements.push(
        await apiRequest(
          `${api}/requirements/${linkedId}`,
          requirementDtoSchema,
        ),
      );
    const history = selected
      ? await apiRequest(
          `${api}/questions/${selected.id}/versions`,
          questionVersionSchema.array(),
        )
      : [];
    data = { projectData, rows, requirements, selected, history };
  } catch (error) {
    return (
      <main>
        <section className="error-panel" role="alert">
          <h1>Chưa mở được câu hỏi.</h1>
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
    (r) =>
      (!q.requirement || r.requirementId === q.requirement) &&
      (!q.status || r.status === q.status) &&
      (q.blocking !== "1" || (r.blocking && r.status !== "CLOSED")),
  );
  return (
    <div className="requirements-shell">
      <header className="topbar">
        <Link href="/">BA Agent · Workspace</Link>
        <Link href={`/?workspace=${workspace.data}&project=${project.data}`}>
          {projectData.name}
        </Link>
      </header>
      <main>
        <nav className="breadcrumb">
          <Link href={base}>Câu hỏi làm rõ</Link>
          <Link
            href={`/requirements?workspace=${workspace.data}&project=${project.data}`}
          >
            Yêu cầu nghiệp vụ
          </Link>
        </nav>
        <section className="page-heading">
          <div>
            <span className="eyebrow">{projectData.name}</span>
            <h1>Làm rõ trước khi quyết định.</h1>
            <p>Ghi lại điều chưa biết, người cần hỏi và câu trả lời đã nhận.</p>
          </div>
          <Link
            className="button primary"
            href={`${base}&view=new${q.requirement ? `&requirement=${q.requirement}` : ""}`}
          >
            + Tạo câu hỏi
          </Link>
        </section>
        {q.saved === "1" && <p role="status">Đã lưu câu hỏi.</p>}
        {selected || q.view === "new" ? (
          <div className="editor-grid">
            <section>
              <QuestionForm
                key={
                  selected
                    ? `${selected.id}-${selected.version}`
                    : `new-${q.requirement ?? ""}`
                }
                workspaceId={workspace.data}
                projectId={project.data}
                question={selected}
                requirements={requirements}
                requirementId={q.requirement}
              />
              {selected?.requirementId && (
                <Link
                  href={`/requirements?workspace=${workspace.data}&project=${project.data}&id=${selected.requirementId}`}
                >
                  Mở yêu cầu liên quan ↗
                </Link>
              )}
            </section>
            <aside>
              <h2>Lịch sử thay đổi</h2>
              {!selected && <p>Lịch sử bắt đầu khi bạn lưu câu hỏi.</p>}
              {history.map((v) => (
                <details className="panel" key={v.version}>
                  <summary>
                    Phiên bản {v.version} · {statusLabels[v.snapshot.status]}
                  </summary>
                  <p>
                    {new Date(v.createdAt).toLocaleString("vi-VN", {
                      timeZone: "Asia/Ho_Chi_Minh",
                    })}
                  </p>
                  <p className="preserve-lines">{v.snapshot.question}</p>
                  <p>
                    {categoryLabels[v.snapshot.category]} · Ưu tiên{" "}
                    {priorityLabels[v.snapshot.priority]} ·{" "}
                    {v.snapshot.blocking ? "Chặn công việc" : "Không chặn"}
                  </p>
                  <p>
                    Người cần hỏi: {v.snapshot.stakeholder || "Chưa ghi nhận"}
                  </p>
                  <p className="preserve-lines">
                    Câu trả lời: {v.snapshot.answer || "Chưa có"}
                  </p>
                  {v.snapshot.requirementId && (
                    <Link
                      href={`/requirements?workspace=${workspace.data}&project=${project.data}&id=${v.snapshot.requirementId}`}
                    >
                      Yêu cầu ở phiên bản này ↗
                    </Link>
                  )}
                </details>
              ))}
            </aside>
          </div>
        ) : (
          <>
            <form className="project-form panel" method="get">
              <input type="hidden" name="workspace" value={workspace.data} />
              <input type="hidden" name="project" value={project.data} />
              <label htmlFor="filter-status">Trạng thái</label>
              <select
                id="filter-status"
                name="status"
                defaultValue={q.status ?? ""}
              >
                <option value="">Tất cả</option>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <label htmlFor="filter-requirement">Yêu cầu liên quan</label>
              <select
                id="filter-requirement"
                name="requirement"
                defaultValue={q.requirement ?? ""}
              >
                <option value="">Tất cả yêu cầu</option>
                {requirements.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <label>
                <input
                  type="checkbox"
                  name="blocking"
                  value="1"
                  defaultChecked={q.blocking === "1"}
                />{" "}
                Chỉ câu hỏi đang chặn công việc
              </label>
              <button className="button secondary">Lọc câu hỏi</button>
            </form>
            <p className="muted">
              Hiển thị {shown.length} câu hỏi trong tối đa 100 câu hỏi gần nhất.
            </p>
            {shown.length ? (
              <div className="project-grid">
                {shown.map((r) => (
                  <Link
                    className="project-card"
                    key={r.id}
                    href={`${base}&id=${r.id}`}
                  >
                    <span className="eyebrow">
                      {statusLabels[r.status]} · {priorityLabels[r.priority]}
                    </span>
                    <h2>{r.question}</h2>
                    <p>
                      {categoryLabels[r.category]}
                      {r.blocking && r.status !== "CLOSED"
                        ? " · Đang chặn công việc"
                        : ""}
                    </p>
                    <p>{r.stakeholder || "Chưa xác định người cần hỏi"}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <section className="empty-state">
                <h2>Chưa có câu hỏi phù hợp.</h2>
                <p>Tạo câu hỏi mới hoặc thay đổi bộ lọc.</p>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
