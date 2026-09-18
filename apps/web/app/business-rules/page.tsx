import Link from "next/link";
import {
  businessRuleDtoSchema,
  businessRuleStatusSchema,
  businessRuleVersionSchema,
  entityIdSchema,
  projectDtoSchema,
  requirementDtoSchema,
} from "@ba/contracts";
import { ApiError, apiRequest } from "@/lib/api";
import { BusinessRuleForm } from "./form";
import { priorityLabels, statusLabels } from "./labels";
import { ProjectShell } from "../project-shell";

export const dynamic = "force-dynamic";

export default async function BusinessRules({
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
  }>;
}) {
  const query = await searchParams;
  const workspace = entityIdSchema.safeParse(query.workspace);
  const project = entityIdSchema.safeParse(query.project);
  if (
    !workspace.success ||
    !project.success ||
    (query.id && !entityIdSchema.safeParse(query.id).success) ||
    (query.status && !businessRuleStatusSchema.safeParse(query.status).success)
  )
    return (
      <main>
        <h1>Đường dẫn chưa hợp lệ.</h1>
        <Link href="/">Về workspace</Link>
      </main>
    );

  const base = `/business-rules?workspace=${workspace.data}&project=${project.data}`;
  const api = `/workspaces/${workspace.data}/projects/${project.data}`;
  let data;
  try {
    const [projectData, rows, requirements] = await Promise.all([
      apiRequest(api, projectDtoSchema),
      apiRequest(`${api}/business-rules`, businessRuleDtoSchema.array()),
      apiRequest(`${api}/requirements`, requirementDtoSchema.array()),
    ]);
    const selected = query.id
      ? await apiRequest(
          `${api}/business-rules/${query.id}`,
          businessRuleDtoSchema,
        )
      : undefined;
    const history = selected
      ? await apiRequest(
          `${api}/business-rules/${selected.id}/versions`,
          businessRuleVersionSchema.array(),
        )
      : [];
    data = { projectData, rows, requirements, selected, history };
  } catch (error) {
    return (
      <main>
        <section className="error-panel" role="alert">
          <h1>Chưa mở được quy tắc nghiệp vụ.</h1>
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
    (rule) => !query.status || rule.status === query.status,
  );
  return (
    <ProjectShell
      workspaceId={workspace.data}
      project={projectData}
      activeSection="business-rules"
      breadcrumbs={[
        { label: "Quy tắc nghiệp vụ", href: selected || query.view === "new" ? base : undefined },
        ...(selected || query.view === "new"
          ? [{ label: selected?.title ?? "Tạo quy tắc" }]
          : []),
      ]}
    >
        <section className="page-heading">
          <div>
            <span className="eyebrow">{projectData.name}</span>
            <h1>Quản trị quy tắc trước khi áp dụng.</h1>
            <p>
              Tạo bản nháp, liên kết yêu cầu và chỉ khóa khi con người phê
              duyệt.
            </p>
          </div>
          <Link className="button primary" href={`${base}&view=new`}>
            + Tạo quy tắc
          </Link>
        </section>
        {query.saved === "1" && <p role="status">Đã lưu quy tắc.</p>}
        {query.approved === "1" && (
          <p role="status">Đã phê duyệt và khóa quy tắc.</p>
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
              <BusinessRuleForm
                key={selected ? `${selected.id}-${selected.version}` : "new"}
                workspaceId={workspace.data}
                projectId={project.data}
                rule={selected}
                requirements={requirements}
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
              {!selected && <p>Lịch sử bắt đầu khi bạn lưu bản nháp.</p>}
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
                    Ưu tiên {priorityLabels[version.snapshot.priority]} ·{" "}
                    {version.snapshot.requirementIds.length} yêu cầu liên quan
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
              <label htmlFor="rule-status">Trạng thái</label>
              <select
                id="rule-status"
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
              <button className="button secondary">Lọc quy tắc</button>
            </form>
            <p className="muted">
              Hiển thị {shown.length} quy tắc trong tối đa 100 quy tắc gần nhất.
            </p>
            {shown.length ? (
              <div className="project-grid">
                {shown.map((rule) => (
                  <Link
                    className="project-card"
                    key={rule.id}
                    href={`${base}&id=${rule.id}`}
                  >
                    <span className="eyebrow">
                      {rule.code} · {statusLabels[rule.status]}
                    </span>
                    <h2>{rule.title}</h2>
                    <p>
                      {priorityLabels[rule.priority]} ·{" "}
                      {rule.requirementIds.length} yêu cầu liên quan
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <section className="empty-state">
                <h2>Chưa có quy tắc phù hợp.</h2>
                <p>Tạo quy tắc mới hoặc thay đổi bộ lọc.</p>
              </section>
            )}
          </>
        )}
    </ProjectShell>
  );
}
