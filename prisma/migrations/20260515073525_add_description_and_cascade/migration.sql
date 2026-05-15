-- DropForeignKey
ALTER TABLE "EnvGroup" DROP CONSTRAINT "EnvGroup_projectId_fkey";

-- DropForeignKey
ALTER TABLE "EnvVariable" DROP CONSTRAINT "EnvVariable_envGroupId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

-- AlterTable
ALTER TABLE "EnvGroup" ADD COLUMN     "description" TEXT;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvGroup" ADD CONSTRAINT "EnvGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnvVariable" ADD CONSTRAINT "EnvVariable_envGroupId_fkey" FOREIGN KEY ("envGroupId") REFERENCES "EnvGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
