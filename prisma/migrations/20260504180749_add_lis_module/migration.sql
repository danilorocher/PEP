-- CreateEnum
CREATE TYPE "LabOrderStatus" AS ENUM ('REQUESTED', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LabSampleStatus" AS ENUM ('COLLECTED', 'SENT', 'ANALYZED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LabExamCategory" AS ENUM ('HEMATOLOGY', 'BIOCHEMISTRY', 'MICROBIOLOGY', 'IMMUNOLOGY', 'URINALYSIS', 'OTHER');

-- CreateTable
CREATE TABLE "LabExam" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "LabExamCategory" NOT NULL,
    "unit" TEXT,
    "referenceRangeMale" JSONB,
    "referenceRangeFemale" JSONB,
    "criticalMin" DOUBLE PRECISION,
    "criticalMax" DOUBLE PRECISION,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LabExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "appointmentId" TEXT,
    "hospitalizationId" TEXT,
    "status" "LabOrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabSample" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3),
    "collectedBy" TEXT,
    "status" "LabSampleStatus" NOT NULL DEFAULT 'COLLECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LabSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "numericValue" DOUBLE PRECISION,
    "unit" TEXT,
    "referenceMin" DOUBLE PRECISION,
    "referenceMax" DOUBLE PRECISION,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "releasedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "labOrderId" TEXT NOT NULL,
    "reportText" TEXT NOT NULL,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "digitalSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LabExam_tenantId_deletedAt_idx" ON "LabExam"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabExam_tenantId_code_key" ON "LabExam"("tenantId", "code");

-- CreateIndex
CREATE INDEX "LabOrder_tenantId_status_idx" ON "LabOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LabOrder_tenantId_patientId_idx" ON "LabOrder"("tenantId", "patientId");

-- CreateIndex
CREATE UNIQUE INDEX "LabSample_barcode_key" ON "LabSample"("barcode");

-- CreateIndex
CREATE INDEX "LabSample_tenantId_barcode_idx" ON "LabSample"("tenantId", "barcode");

-- CreateIndex
CREATE INDEX "LabResult_tenantId_labOrderId_idx" ON "LabResult"("tenantId", "labOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "LabReport_labOrderId_key" ON "LabReport"("labOrderId");

-- CreateIndex
CREATE INDEX "LabReport_tenantId_signedAt_idx" ON "LabReport"("tenantId", "signedAt");

-- AddForeignKey
ALTER TABLE "LabExam" ADD CONSTRAINT "LabExam_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSample" ADD CONSTRAINT "LabSample_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSample" ADD CONSTRAINT "LabSample_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabSample" ADD CONSTRAINT "LabSample_collectedBy_fkey" FOREIGN KEY ("collectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "LabExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_releasedBy_fkey" FOREIGN KEY ("releasedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReport" ADD CONSTRAINT "LabReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReport" ADD CONSTRAINT "LabReport_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReport" ADD CONSTRAINT "LabReport_signedBy_fkey" FOREIGN KEY ("signedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
