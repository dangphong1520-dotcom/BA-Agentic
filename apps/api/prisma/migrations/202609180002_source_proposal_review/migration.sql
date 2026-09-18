CREATE TYPE "SourceAnalysisReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

ALTER TABLE "SourceAnalysis"
ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "reviewStatus" "SourceAnalysisReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "reviewedBy" UUID,
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "acceptedRequirementId" UUID;

CREATE UNIQUE INDEX "SourceAnalysis_acceptedRequirementId_key"
ON "SourceAnalysis"("acceptedRequirementId");

CREATE UNIQUE INDEX "SourceAnalysis_projectId_acceptedRequirementId_key"
ON "SourceAnalysis"("projectId", "acceptedRequirementId");

ALTER TABLE "SourceAnalysis"
ADD CONSTRAINT "SourceAnalysis_reviewedBy_fkey"
FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SourceAnalysis"
ADD CONSTRAINT "SourceAnalysis_projectId_acceptedRequirementId_fkey"
FOREIGN KEY ("projectId", "acceptedRequirementId")
REFERENCES "Requirement"("projectId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
