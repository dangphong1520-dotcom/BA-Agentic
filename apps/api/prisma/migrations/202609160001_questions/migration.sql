-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('BUSINESS', 'PROCESS', 'DATA', 'RULE', 'SYSTEM', 'TECHNICAL', 'UI_UX', 'EXCEPTION', 'SECURITY', 'DEPENDENCY');

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "requirementId" UUID,
    "question" VARCHAR(2000) NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "priority" "QuestionPriority" NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "stakeholder" VARCHAR(120) NOT NULL DEFAULT '',
    "answer" VARCHAR(4000) NOT NULL DEFAULT '',
    "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVersion" (
    "questionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVersion_pkey" PRIMARY KEY ("questionId","version")
);

-- CreateIndex
CREATE INDEX "Question_workspaceId_projectId_createdAt_id_idx" ON "Question"("workspaceId", "projectId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Question_projectId_requirementId_idx" ON "Question"("projectId", "requirementId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_projectId_requirementId_fkey" FOREIGN KEY ("projectId", "requirementId") REFERENCES "Requirement"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVersion" ADD CONSTRAINT "QuestionVersion_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
