import { Injectable } from '@nestjs/common';
import type {
  ProjectDto,
  SourceAnalysisResult,
  SourceDto,
} from '@ba/contracts';

@Injectable()
export class SourceAnalysisGateway {
  readonly modelProfile = 'LOCAL_DETERMINISTIC_V1';

  analyze(source: SourceDto, project: ProjectDto): SourceAnalysisResult {
    if (source.content.includes('[[INVALID_ANALYSIS]]'))
      throw new Error('INVALID_MODEL_OUTPUT');
    const first = source.segments[0];
    if (!first) throw new Error('EMPTY_SOURCE');
    const text = source.content.trim();
    const title = first.text.slice(0, 120);
    return {
      requirement: {
        title,
        type: 'FUNCTIONAL',
        priority: 'UNDEFINED',
        description: text.slice(0, 4000),
        businessGoal: project.businessGoal,
        actor: '',
        preconditions: '',
        mainFlow: '',
        exceptionFlow: '',
        acceptanceCriteria: '',
        sourceNote: `Đề xuất từ nguồn “${source.title}”, bản ${source.revision}.`,
        classification: 'PROPOSAL',
        evidenceSegmentIds: source.segments.map((row) => row.id).slice(0, 20),
        confidence: 0.65,
      },
      findings: [
        {
          type: 'MISSING_INFORMATION',
          description: 'Chưa có tiêu chí chấp nhận có thể kiểm thử.',
          classification: 'INFERENCE',
          evidenceSegmentIds: [first.id],
          confidence: 0.9,
        },
      ],
      questions: [
        {
          question: 'Tiêu chí nào xác nhận yêu cầu này đã được đáp ứng?',
          reason: 'Nguồn chưa nêu kết quả có thể kiểm thử.',
          classification: 'OPEN_QUESTION',
          evidenceSegmentIds: [first.id],
        },
      ],
    };
  }
}
