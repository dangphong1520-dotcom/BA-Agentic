import Link from "next/link";
import {
  projectDtoSchema,
  workspaceDtoSchema,
  type ProjectDto,
} from "@ba/contracts";
import { apiRequest } from "@/lib/api";

type Section =
  | "requirements"
  | "sources"
  | "questions"
  | "business-rules"
  | "decisions";

const sections: { id: Section; label: string; symbol: string }[] = [
  { id: "requirements", label: "Yêu cầu nghiệp vụ", symbol: "▤" },
  { id: "sources", label: "Nguồn thông tin", symbol: "◫" },
  { id: "questions", label: "Câu hỏi làm rõ", symbol: "?" },
  { id: "business-rules", label: "Quy tắc nghiệp vụ", symbol: "◇" },
  { id: "decisions", label: "Quyết định", symbol: "✓" },
];

export type BreadcrumbItem = { label: string; href?: string };

export async function ProjectShell({
  workspaceId,
  project,
  activeSection,
  breadcrumbs,
  children,
}: {
  workspaceId: string;
  project: ProjectDto;
  activeSection: Section;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
}) {
  const [workspaces, projects] = await Promise.all([
    apiRequest("/workspaces", workspaceDtoSchema.array()),
    apiRequest(`/workspaces/${workspaceId}/projects`, projectDtoSchema.array()),
  ]);
  const query = `workspace=${workspaceId}&project=${project.id}`;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Đến nội dung chính
      </a>
      <aside className="sidebar" aria-label="Điều hướng workspace">
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
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/?workspace=${workspace.id}`}
              className={`workspace-link ${workspace.id === workspaceId ? "selected" : ""}`}
              aria-current={workspace.id === workspaceId ? "page" : undefined}
            >
              <span className="workspace-icon">
                {workspace.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate">{workspace.name}</span>
              <span aria-hidden="true">⌄</span>
            </Link>
          ))}
        </nav>
        <div className="side-divider" />
        <Link href={`/?workspace=${workspaceId}`} className="side-link">
          <span aria-hidden="true">▦</span>
          <span>Dự án</span>
          <span className="tiny-count">{projects.length}</span>
        </Link>
        <nav className="project-navigation" aria-label="Module dự án">
          {sections.map((section) => (
            <Link
              key={section.id}
              href={`/${section.id}?${query}`}
              className={`side-link ${section.id === activeSection ? "side-active" : ""}`}
              aria-current={section.id === activeSection ? "page" : undefined}
            >
              <span aria-hidden="true">{section.symbol}</span>
              <span>{section.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-star" aria-hidden="true">✳</span>
          <p>
            Bắt đầu từ bối cảnh.
            <br />
            <strong>Xây dựng sự rõ ràng.</strong>
          </p>
          <span className="muted small">Một không gian cho công việc BA của bạn.</span>
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
          <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
            <Link href={`/?workspace=${workspaceId}`}>Không gian làm việc</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/?workspace=${workspaceId}&project=${project.id}`}>
              {project.name}
            </Link>
            {breadcrumbs.map((item, index) => (
              <span className="breadcrumb-part" key={`${item.label}-${index}`}>
                <span aria-hidden="true">/</span>
                {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
              </span>
            ))}
          </nav>
          <span className="topbar-label">
            BA AGENT PLATFORM <span aria-hidden="true">✳</span>
          </span>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
