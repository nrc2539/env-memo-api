-- AlterTable
ALTER TABLE "EnvGroup" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "deletedAt" TIMESTAMP(3);
