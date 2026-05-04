-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "hashPermissoes" TEXT;

-- CreateIndex
CREATE INDEX "Role_tenantId_hashPermissoes_idx" ON "Role"("tenantId", "hashPermissoes");
