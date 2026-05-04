-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('OPEN', 'CLOSED', 'BILLED', 'DENIED', 'PAID');

-- CreateEnum
CREATE TYPE "AccountItemType" AS ENUM ('PROCEDURE', 'MEDICATION', 'MATERIAL', 'DAILY_RATE', 'FEE');

-- CreateEnum
CREATE TYPE "SourceModule" AS ENUM ('PRESCRIPTION', 'SURGERY', 'PHARMACY', 'ATTENDANCE', 'MANUAL');

-- CreateEnum
CREATE TYPE "SUSBillingType" AS ENUM ('AIH', 'BPA');

-- CreateEnum
CREATE TYPE "SUSBillingStatus" AS ENUM ('GENERATED', 'SENT', 'ACCEPTED', 'DENIED');

-- CreateEnum
CREATE TYPE "DenialStatus" AS ENUM ('OPEN', 'APPEALED', 'RESOLVED');

-- CreateTable
CREATE TABLE "HospitalAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "appointmentId" TEXT,
    "drgGroupId" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'OPEN',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "billingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HospitalAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalAccountItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tipo" "AccountItemType" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "referenceId" TEXT,
    "sourceModule" "SourceModule" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HospitalAccountItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SUSBilling" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "SUSBillingType" NOT NULL,
    "status" "SUSBillingStatus" NOT NULL DEFAULT 'GENERATED',
    "protocolNumber" TEXT,
    "submissionDate" TIMESTAMP(3),
    "returnDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SUSBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingDenial" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amountDenied" DOUBLE PRECISION NOT NULL,
    "status" "DenialStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BillingDenial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DRGGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "averageCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DRGGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HospitalAccount_tenantId_status_idx" ON "HospitalAccount"("tenantId", "status");

-- CreateIndex
CREATE INDEX "HospitalAccount_tenantId_patientId_idx" ON "HospitalAccount"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "HospitalAccountItem_tenantId_accountId_idx" ON "HospitalAccountItem"("tenantId", "accountId");

-- CreateIndex
CREATE INDEX "SUSBilling_tenantId_type_status_idx" ON "SUSBilling"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "BillingDenial_tenantId_status_idx" ON "BillingDenial"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DRGGroup_tenantId_code_key" ON "DRGGroup"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "HospitalAccount" ADD CONSTRAINT "HospitalAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAccount" ADD CONSTRAINT "HospitalAccount_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAccount" ADD CONSTRAINT "HospitalAccount_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAccount" ADD CONSTRAINT "HospitalAccount_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAccount" ADD CONSTRAINT "HospitalAccount_drgGroupId_fkey" FOREIGN KEY ("drgGroupId") REFERENCES "DRGGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAccountItem" ADD CONSTRAINT "HospitalAccountItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalAccountItem" ADD CONSTRAINT "HospitalAccountItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HospitalAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SUSBilling" ADD CONSTRAINT "SUSBilling_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SUSBilling" ADD CONSTRAINT "SUSBilling_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HospitalAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDenial" ADD CONSTRAINT "BillingDenial_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingDenial" ADD CONSTRAINT "BillingDenial_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "HospitalAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DRGGroup" ADD CONSTRAINT "DRGGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
