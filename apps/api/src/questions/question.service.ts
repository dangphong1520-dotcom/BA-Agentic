import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  questionDtoSchema,
  questionVersionSchema,
  type CreateQuestion,
  type UpdateQuestion,
  createQuestionSchema,
  updateQuestionSchema,
} from '@ba/contracts';
import { BadRequestException } from '@nestjs/common';
import { RequirementService } from '../requirements/requirement.service.js';
import { ProjectService } from '../projects/project.service.js';
import { QuestionRepository } from './question.repository.js';

@Injectable()
export class QuestionService {
  constructor(
    @Inject(RequirementService)
    private readonly requirements: RequirementService,
    @Inject(ProjectService) private readonly projects: ProjectService,
    @Inject(QuestionRepository)
    private readonly repository: QuestionRepository,
  ) {}
  private dto(
    row: NonNullable<Awaited<ReturnType<QuestionRepository['get']>>>,
  ) {
    return questionDtoSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }
  async list(user: string, workspace: string, project: string) {
    await this.projects.getProject(user, workspace, project);
    return (await this.repository.list(workspace, project)).map((row) =>
      this.dto(row),
    );
  }
  async get(user: string, workspace: string, project: string, id: string) {
    await this.projects.getProject(user, workspace, project);
    const row = await this.repository.get(workspace, project, id);
    if (!row) throw new NotFoundException('Question not found');
    return this.dto(row);
  }
  async history(user: string, workspace: string, project: string, id: string) {
    await this.get(user, workspace, project, id);
    return (await this.repository.history(id)).map((row) =>
      questionVersionSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }
  async create(
    user: string,
    workspace: string,
    project: string,
    data: CreateQuestion,
  ) {
    await this.projects.getProject(user, workspace, project);
    const parsed = createQuestionSchema.safeParse(data);
    if (!parsed.success) throw new BadRequestException('Invalid question');
    data = parsed.data;
    if (data.requirementId)
      await this.requirements.get(user, workspace, project, data.requirementId);
    return this.dto(
      await this.repository.create(user, workspace, project, data),
    );
  }
  async update(
    user: string,
    workspace: string,
    project: string,
    id: string,
    data: UpdateQuestion,
  ) {
    const current = await this.get(user, workspace, project, id);
    const parsed = updateQuestionSchema.safeParse(data);
    if (!parsed.success)
      throw new BadRequestException('Invalid answer or question');
    data = parsed.data;
    if (current.version !== data.expectedVersion || current.status === 'CLOSED')
      throw new ConflictException('Question changed or is closed');
    if (data.status === 'CLOSED' && current.status !== 'ANSWERED')
      throw new BadRequestException('Record an answer before closing');
    if (data.requirementId)
      await this.requirements.get(user, workspace, project, data.requirementId);
    const row = await this.repository.update(
      user,
      workspace,
      project,
      id,
      data,
    );
    if (!row)
      throw new ConflictException('Question changed or is no longer editable');
    return this.dto(row);
  }
}
