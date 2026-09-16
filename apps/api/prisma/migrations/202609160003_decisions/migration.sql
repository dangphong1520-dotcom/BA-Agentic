-- CreateEnum
CREATE TYPE "DecisionStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'SUPERSEDED', 'DEPRECATED');

-- CreateTable
CREATE TABLE "Decision" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(4000) NOT NULL,
    "rationale" VARCHAR(4000) NOT NULL,
    "status" "DecisionStatus" NOT NULL DEFAULT 'PROPOSED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID NOT NULL,
    "decidedBy" UUID,
    "decisionDate" TIMESTAMP(3),
    "supersededById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionRequirement" (
    "projectId" UUID NOT NULL,
    "decisionId" UUID NOT NULL,
    "requirementId" UUID NOT NULL,

    CONSTRAINT "DecisionRequirement_pkey" PRIMARY KEY ("decisionId","requirementId")
);

-- CreateTable
CREATE TABLE "DecisionVersion" (
    "decisionId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionVersion_pkey" PRIMARY KEY ("decisionId","version")
);

-- CreateIndex
CREATE INDEX "Decision_workspaceId_projectId_createdAt_id_idx" ON "Decision"("workspaceId", "projectId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_projectId_id_key" ON "Decision"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Decision_projectId_code_key" ON "Decision"("projectId", "code");

-- CreateIndex
CREATE INDEX "DecisionRequirement_projectId_requirementId_idx" ON "DecisionRequirement"("projectId", "requirementId");

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_decidedBy_fkey" FOREIGN KEY ("decidedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_projectId_supersededById_fkey" FOREIGN KEY ("projectId", "supersededById") REFERENCES "Decision"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionRequirement" ADD CONSTRAINT "DecisionRequirement_projectId_decisionId_fkey" FOREIGN KEY ("projectId", "decisionId") REFERENCES "Decision"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionRequirement" ADD CONSTRAINT "DecisionRequirement_projectId_requirementId_fkey" FOREIGN KEY ("projectId", "requirementId") REFERENCES "Requirement"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionVersion" ADD CONSTRAINT "DecisionVersion_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionVersion" ADD CONSTRAINT "DecisionVersion_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
