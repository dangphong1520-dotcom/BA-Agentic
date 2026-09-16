-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL_INPUT', 'MEETING', 'DOCUMENT', 'EMAIL', 'CHAT');

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "type" "SourceType" NOT NULL,
    "content" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceSegment" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "line" INTEGER NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "SourceSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementEvidence" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "requirementId" UUID NOT NULL,
    "requirementVersion" INTEGER NOT NULL,
    "segmentId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequirementEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Source_workspaceId_projectId_createdAt_id_idx" ON "Source"("workspaceId", "projectId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Source_projectId_id_key" ON "Source"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SourceSegment_projectId_id_key" ON "SourceSegment"("projectId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SourceSegment_sourceId_line_key" ON "SourceSegment"("sourceId", "line");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementEvidence_requirementId_requirementVersion_segmen_key" ON "RequirementEvidence"("requirementId", "requirementVersion", "segmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_projectId_id_key" ON "Requirement"("projectId", "id");

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSegment" ADD CONSTRAINT "SourceSegment_projectId_sourceId_fkey" FOREIGN KEY ("projectId", "sourceId") REFERENCES "Source"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_projectId_requirementId_fkey" FOREIGN KEY ("projectId", "requirementId") REFERENCES "Requirement"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_requirementId_requirementVersion_fkey" FOREIGN KEY ("requirementId", "requirementVersion") REFERENCES "RequirementVersion"("requirementId", "version") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_projectId_segmentId_fkey" FOREIGN KEY ("projectId", "segmentId") REFERENCES "SourceSegment"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementEvidence" ADD CONSTRAINT "RequirementEvidence_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
