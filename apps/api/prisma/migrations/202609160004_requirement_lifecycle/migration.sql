-- AlterEnum
ALTER TYPE "RequirementStatus" ADD VALUE 'CLARIFICATION_REQUIRED';
ALTER TYPE "RequirementStatus" ADD VALUE 'READY_FOR_REVIEW';
ALTER TYPE "RequirementStatus" ADD VALUE 'APPROVED';
ALTER TYPE "RequirementStatus" ADD VALUE 'BASELINED';

-- AlterTable
ALTER TABLE "Requirement" ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "approvedBy" UUID,
ADD COLUMN "baselinedAt" TIMESTAMP(3),
ADD COLUMN "baselinedBy" UUID;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_baselinedBy_fkey" FOREIGN KEY ("baselinedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
