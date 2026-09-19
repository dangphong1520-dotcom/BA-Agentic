import { Inject, Injectable } from '@nestjs/common';
import { designPreviewSchema, type DesignPreview } from '@ba/contracts';
import { RequirementService } from '../requirements/requirement.service.js';

@Injectable()
export class DesignStudioService {
  constructor(@Inject(RequirementService) private readonly requirements: RequirementService) {}

  async preview(user: string, workspace: string, project: string, id: string): Promise<DesignPreview> {
    const requirement = await this.requirements.get(user, workspace, project, id);
    const actions = requirement.mainFlow.split(/\r?\n|\s*->\s*/).map((value) => value.replace(/^\s*\d+[.)-]?\s*/, '').trim()).filter(Boolean);
    const mainActions = actions.length ? actions : [requirement.description || requirement.title];
    const exception = requirement.exceptionFlow.trim();
    const actor = requirement.actor.trim() || 'Người dùng';
    const nodes = [
      { id: 'start', label: requirement.preconditions.trim() || 'Bắt đầu', kind: 'START' as const },
      ...mainActions.map((label, index) => ({ id: `action-${index + 1}`, label, kind: 'ACTION' as const })),
      ...(exception ? [{ id: 'exception', label: exception, kind: 'DECISION' as const }] : []),
      { id: 'end', label: requirement.acceptanceCriteria.trim() || 'Hoàn tất yêu cầu', kind: 'END' as const },
    ];
    return designPreviewSchema.parse({
      requirementId: requirement.id,
      requirementVersion: requirement.version,
      generatorProfile: 'LOCAL_DETERMINISTIC_V1',
      classification: 'PROPOSAL',
      generatedAt: new Date().toISOString(),
      flow: { title: requirement.title, nodes },
      bpmn: {
        title: `BPMN draft — ${requirement.title}`,
        lanes: [
          { name: actor, activities: [nodes[0].label, ...mainActions.filter((_, index) => index % 2 === 0)] },
          { name: 'Hệ thống', activities: mainActions.filter((_, index) => index % 2 === 1).concat(exception ? [exception] : [], [nodes.at(-1)?.label ?? 'Hoàn tất']) },
        ],
      },
      prototype: {
        title: `Prototype draft — ${requirement.title}`,
        screens: [
          { name: 'Màn hình bắt đầu', purpose: `Giúp ${actor} khởi tạo tác vụ`, elements: ['Tiêu đề nghiệp vụ', 'Thông tin đầu vào', 'Nút tiếp tục'] },
          { name: 'Màn hình xử lý', purpose: mainActions[0], elements: mainActions.slice(0, 4) },
          { name: 'Màn hình kết quả', purpose: requirement.acceptanceCriteria.trim() || 'Xác nhận kết quả', elements: ['Trạng thái', 'Tóm tắt kết quả', 'Hành động tiếp theo'] },
        ],
      },
    });
  }
}
