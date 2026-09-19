CREATE TYPE "DesignArtifactStatus" AS ENUM ('PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'STALE', 'FAILED');
CREATE TYPE "DesignGenerationTrigger" AS ENUM ('MANUAL', 'REQUIREMENT_CHANGED');
CREATE TABLE "DesignArtifact" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "workspaceId" UUID NOT NULL, "projectId" UUID NOT NULL,
  "requirementId" UUID NOT NULL, "requirementVersion" INTEGER NOT NULL, "artifactVersion" INTEGER NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1, "status" "DesignArtifactStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "trigger" "DesignGenerationTrigger" NOT NULL, "generatorProfile" VARCHAR(80) NOT NULL, "result" JSONB,
  "errorMessage" VARCHAR(500), "createdBy" UUID NOT NULL, "reviewedBy" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "DesignArtifact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "DesignArtifact_requirementId_artifactVersion_key" ON "DesignArtifact"("requirementId", "artifactVersion");
CREATE UNIQUE INDEX "DesignArtifact_requirementId_requirementVersion_generatorProfile_key" ON "DesignArtifact"("requirementId", "requirementVersion", "generatorProfile");
CREATE INDEX "DesignArtifact_workspaceId_projectId_requirementId_createdAt_idx" ON "DesignArtifact"("workspaceId", "projectId", "requirementId", "createdAt");
ALTER TABLE "DesignArtifact" ADD CONSTRAINT "DesignArtifact_project_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DesignArtifact" ADD CONSTRAINT "DesignArtifact_requirement_fkey" FOREIGN KEY ("projectId", "requirementId") REFERENCES "Requirement"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DesignArtifact" ADD CONSTRAINT "DesignArtifact_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DesignArtifact" ADD CONSTRAINT "DesignArtifact_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
