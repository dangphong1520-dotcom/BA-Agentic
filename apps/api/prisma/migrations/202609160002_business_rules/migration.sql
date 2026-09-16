-- CreateEnum
CREATE TYPE "BusinessRuleStatus" AS ENUM ('DRAFT', 'APPROVED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "BusinessRulePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "BusinessRule" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "code" VARCHAR(11) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(4000) NOT NULL,
    "priority" "BusinessRulePriority" NOT NULL,
    "status" "BusinessRuleStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID NOT NULL,
    "approvedBy" UUID,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessRuleRequirement" (
    "projectId" UUID NOT NULL,
    "businessRuleId" UUID NOT NULL,
    "requirementId" UUID NOT NULL,

    CONSTRAINT "BusinessRuleRequirement_pkey" PRIMARY KEY ("businessRuleId","requirementId")
);

-- CreateTable
CREATE TABLE "BusinessRuleVersion" (
    "businessRuleId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessRuleVersion_pkey" PRIMARY KEY ("businessRuleId","version")
);

-- CreateIndex
CREATE INDEX "BusinessRule_workspaceId_projectId_createdAt_id_idx" ON "BusinessRule"("workspaceId", "projectId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRule_projectId_id_key" ON "BusinessRule"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessRule_projectId_code_key" ON "BusinessRule"("projectId", "code");

-- CreateIndex
CREATE INDEX "BusinessRuleRequirement_projectId_requirementId_idx" ON "BusinessRuleRequirement"("projectId", "requirementId");

-- AddForeignKey
ALTER TABLE "BusinessRule" ADD CONSTRAINT "BusinessRule_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRule" ADD CONSTRAINT "BusinessRule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRule" ADD CONSTRAINT "BusinessRule_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRuleRequirement" ADD CONSTRAINT "BusinessRuleRequirement_projectId_businessRuleId_fkey" FOREIGN KEY ("projectId", "businessRuleId") REFERENCES "BusinessRule"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRuleRequirement" ADD CONSTRAINT "BusinessRuleRequirement_projectId_requirementId_fkey" FOREIGN KEY ("projectId", "requirementId") REFERENCES "Requirement"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRuleVersion" ADD CONSTRAINT "BusinessRuleVersion_businessRuleId_fkey" FOREIGN KEY ("businessRuleId") REFERENCES "BusinessRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessRuleVersion" ADD CONSTRAINT "BusinessRuleVersion_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
