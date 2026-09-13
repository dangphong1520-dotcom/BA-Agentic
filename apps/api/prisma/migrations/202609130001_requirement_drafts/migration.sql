-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT');

-- CreateEnum
CREATE TYPE "RequirementType" AS ENUM ('BUSINESS', 'FUNCTIONAL', 'NON_FUNCTIONAL');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('UNDEFINED', 'MUST', 'SHOULD', 'COULD', 'WONT');

-- CreateTable
CREATE TABLE "Requirement" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "type" "RequirementType" NOT NULL,
    "priority" "RequirementPriority" NOT NULL,
    "status" "RequirementStatus" NOT NULL DEFAULT 'DRAFT',
    "description" VARCHAR(4000) NOT NULL,
    "businessGoal" VARCHAR(4000) NOT NULL,
    "actor" VARCHAR(4000) NOT NULL,
    "preconditions" VARCHAR(4000) NOT NULL,
    "mainFlow" VARCHAR(4000) NOT NULL,
    "exceptionFlow" VARCHAR(4000) NOT NULL,
    "acceptanceCriteria" VARCHAR(4000) NOT NULL,
    "sourceNote" VARCHAR(4000) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementVersion" (
    "requirementId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementVersion_pkey" PRIMARY KEY ("requirementId","version")
);

-- CreateIndex
CREATE INDEX "Requirement_workspaceId_projectId_createdAt_id_idx" ON "Requirement"("workspaceId", "projectId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementVersion" ADD CONSTRAINT "RequirementVersion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementVersion" ADD CONSTRAINT "RequirementVersion_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
