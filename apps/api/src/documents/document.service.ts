import { Inject, Injectable } from '@nestjs/common';
import { documentPreviewSchema, type DocumentFormat } from '@ba/contracts';
import { ProjectService } from '../projects/project.service.js';
import { RequirementService } from '../requirements/requirement.service.js';

@Injectable()
export class DocumentService {
  constructor(@Inject(ProjectService) private readonly projects: ProjectService, @Inject(RequirementService) private readonly requirements: RequirementService) {}
  async preview(user: string, workspace: string, projectId: string, format: DocumentFormat) {
    const [project, requirements] = await Promise.all([this.projects.getProject(user, workspace, projectId), this.requirements.list(user, workspace, projectId)]);
    const numbered = requirements.map((row, index) => `${index + 1}. ${row.title} [${row.status}, V${row.version}]\n   ${row.description || 'Chưa có mô tả.'}`).join('\n');
    const flows = requirements.map((row) => `### ${row.title}\n- Actor: ${row.actor || 'Chưa xác định'}\n- Luồng chính: ${row.mainFlow || 'Chưa xác định'}\n- Ngoại lệ: ${row.exceptionFlow || 'Chưa xác định'}\n- Acceptance Criteria: ${row.acceptanceCriteria || 'Chưa xác định'}`).join('\n\n');
    const common = [{ heading: 'Thông tin kiểm soát', content: `Trạng thái: PROPOSAL\nDự án: ${project.name}\nPhiên bản dự án: ${project.version}\nTổng số requirement: ${requirements.length}` }];
    const sections = format === 'BRD' ? [...common,
      { heading: 'Bối cảnh và vấn đề', content: project.description || 'Chưa có bối cảnh được xác nhận.' },
      { heading: 'Mục tiêu nghiệp vụ', content: project.businessGoal || 'Chưa có mục tiêu nghiệp vụ được xác nhận.' },
      { heading: 'Phạm vi yêu cầu', content: numbered || 'Chưa có requirement.' },
      { heading: 'Điểm cần làm rõ', content: 'Kiểm tra Questions và Findings trước khi phê duyệt tài liệu.' },
    ] : format === 'PRD' ? [...common,
      { heading: 'Tầm nhìn sản phẩm', content: project.businessGoal || project.description || 'Chưa xác định.' },
      { heading: 'Người dùng và nhu cầu', content: requirements.map((row) => `${row.actor || 'Người dùng chưa xác định'} — ${row.title}`).join('\n') || 'Chưa có requirement.' },
      { heading: 'Năng lực sản phẩm', content: numbered || 'Chưa có requirement.' },
      { heading: 'Tiêu chí thành công', content: requirements.map((row) => `- ${row.title}: ${row.acceptanceCriteria || 'Chưa xác định'}`).join('\n') },
    ] : [...common,
      { heading: 'Tổng quan hệ thống', content: project.description || project.businessGoal || 'Chưa xác định.' },
      { heading: 'Yêu cầu chức năng và phi chức năng', content: requirements.map((row) => `- [${row.type}] ${row.title}: ${row.description || 'Chưa có mô tả'}`).join('\n') || 'Chưa có requirement.' },
      { heading: 'Luồng và giao diện', content: flows || 'Chưa có requirement.' },
      { heading: 'Điều kiện nghiệm thu', content: requirements.map((row) => `- ${row.title}: ${row.acceptanceCriteria || 'Chưa xác định'}`).join('\n') },
    ];
    return documentPreviewSchema.parse({ format, classification: 'PROPOSAL', generatorProfile: 'STRUCTURED_PROJECT_KNOWLEDGE_V1', generatedAt: new Date().toISOString(), title: `${format} — ${project.name}`, requirementVersions: requirements.map((row) => ({ id: row.id, version: row.version })), sections });
  }
}
