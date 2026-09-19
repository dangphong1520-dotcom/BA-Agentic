import { Injectable } from '@nestjs/common';
import { designContentSchema, type DesignContent, type RequirementDto } from '@ba/contracts';

@Injectable()
export class DesignStudioGateway {
  private local(requirement: RequirementDto, instruction = ''): DesignContent {
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
    return designContentSchema.parse({
      flow: { title: requirement.title, nodes },
      bpmn: { title: `BPMN draft — ${requirement.title}`, lanes: [
        { name: actor, activities: [nodes[0].label, ...mainActions.filter((_, index) => index % 2 === 0)] },
        { name: 'Hệ thống', activities: mainActions.filter((_, index) => index % 2 === 1).concat(exception ? [exception] : [], [nodes.at(-1)?.label ?? 'Hoàn tất']) },
      ] },
      prototype: { title: `Prototype draft — ${requirement.title}`, screens: [
        { name: 'Màn hình bắt đầu', purpose: `Giúp ${actor} khởi tạo tác vụ`, elements: ['Tiêu đề nghiệp vụ', 'Thông tin đầu vào', 'Nút tiếp tục'] },
        { name: 'Màn hình xử lý', purpose: mainActions[0], elements: mainActions.slice(0, 4) },
        { name: 'Màn hình kết quả', purpose: requirement.acceptanceCriteria.trim() || 'Xác nhận kết quả', elements: ['Trạng thái', 'Tóm tắt kết quả', 'Hành động tiếp theo'] },
        ...(instruction ? [{ name: 'Tinh chỉnh từ prompt', purpose: instruction, elements: ['Nội dung đề xuất', 'Trạng thái review', 'Tiếp tục tinh chỉnh'] }] : []),
      ] },
    });
  }

  private async openai(requirement: RequirementDto, apiKey: string, instruction = '') {
    const model = process.env.OPENAI_DESIGN_MODEL ?? 'gpt-5.6-luna';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(45_000),
      body: JSON.stringify({
        model, store: false,
        instructions: 'You are a senior Business Analyst and UX designer. Produce conservative design proposals only from the supplied requirement. Do not invent confirmed facts. Use Vietnamese.',
        input: JSON.stringify({ requirement, refinementInstruction: instruction }),
        text: { format: { type: 'json_schema', name: 'ba_design', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['flow', 'bpmn', 'prototype'], properties: {
            flow: { type: 'object', additionalProperties: false, required: ['title', 'nodes'], properties: { title: { type: 'string' }, nodes: { type: 'array', minItems: 2, items: { type: 'object', additionalProperties: false, required: ['id', 'label', 'kind'], properties: { id: { type: 'string' }, label: { type: 'string' }, kind: { type: 'string', enum: ['START', 'ACTION', 'DECISION', 'END'] } } } } } },
            bpmn: { type: 'object', additionalProperties: false, required: ['title', 'lanes'], properties: { title: { type: 'string' }, lanes: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['name', 'activities'], properties: { name: { type: 'string' }, activities: { type: 'array', items: { type: 'string' } } } } } } },
            prototype: { type: 'object', additionalProperties: false, required: ['title', 'screens'], properties: { title: { type: 'string' }, screens: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['name', 'purpose', 'elements'], properties: { name: { type: 'string' }, purpose: { type: 'string' }, elements: { type: 'array', items: { type: 'string' } } } } } } },
          },
        } } },
      }),
    });
    if (!response.ok) throw new Error(`MODEL_HTTP_${response.status}`);
    const body = await response.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = body.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;
    if (!text) throw new Error('MODEL_EMPTY_OUTPUT');
    return { content: designContentSchema.parse(JSON.parse(text)), profile: `OPENAI_RESPONSES_${model}` };
  }

  async generate(requirement: RequirementDto, instruction = '') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try { return await this.openai(requirement, apiKey, instruction); }
      catch { return { content: this.local(requirement, instruction), profile: 'OPENAI_FAILED_LOCAL_FALLBACK_V1' }; }
    }
    return { content: this.local(requirement, instruction), profile: 'LOCAL_DETERMINISTIC_V1' };
  }
}
