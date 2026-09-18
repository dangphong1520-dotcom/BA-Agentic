CREATE TYPE "SourceAnalysisStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "SourceAnalysis" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "sourceRevision" INTEGER NOT NULL,
    "status" "SourceAnalysisStatus" NOT NULL DEFAULT 'RUNNING',
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "modelProfile" VARCHAR(80) NOT NULL,
    "requestedBy" UUID NOT NULL,
    "result" JSONB,
    "errorCode" VARCHAR(80),
    "errorMessage" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "SourceAnalysis_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SourceAnalysis_workspaceId_projectId_sourceId_createdAt_id_idx" ON "SourceAnalysis"("workspaceId", "projectId", "sourceId", "createdAt", "id");
ALTER TABLE "SourceAnalysis" ADD CONSTRAINT "SourceAnalysis_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SourceAnalysis" ADD CONSTRAINT "SourceAnalysis_projectId_sourceId_fkey" FOREIGN KEY ("projectId", "sourceId") REFERENCES "Source"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SourceAnalysis" ADD CONSTRAINT "SourceAnalysis_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
