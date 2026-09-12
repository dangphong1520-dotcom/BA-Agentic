-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("workspaceId","userId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(4000) NOT NULL DEFAULT '',
    "businessGoal" VARCHAR(4000) NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "workspaceId" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_workspaceId_id_key" ON "Project"("workspaceId", "id");

-- CreateIndex
CREATE INDEX "ProjectMember_workspaceId_userId_idx" ON "ProjectMember"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_workspaceId_projectId_fkey" FOREIGN KEY ("workspaceId", "projectId") REFERENCES "Project"("workspaceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_workspaceId_userId_fkey" FOREIGN KEY ("workspaceId", "userId") REFERENCES "WorkspaceMember"("workspaceId", "userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
