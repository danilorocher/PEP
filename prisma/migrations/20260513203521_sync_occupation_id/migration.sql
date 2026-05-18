/*
  Warnings:

  - A unique constraint covering the columns `[nome,tenantId]` on the table `Specialty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenantId` to the `Specialty` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Specialty_nome_key";

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "occupationId" TEXT;

-- AlterTable
ALTER TABLE "Nurse" ADD COLUMN     "occupationId" TEXT;

-- AlterTable
ALTER TABLE "Specialty" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "occupationId" TEXT;

-- CreateTable
CREATE TABLE "Occupation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoCBO" TEXT,
    "tipoBase" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Occupation_tenantId_deletedAt_idx" ON "Occupation"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Specialty_tenantId_idx" ON "Specialty"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_nome_tenantId_key" ON "Specialty"("nome", "tenantId");

-- AddForeignKey
ALTER TABLE "Occupation" ADD CONSTRAINT "Occupation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
