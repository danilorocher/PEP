-- CreateEnum
CREATE TYPE "FluidEntryType" AS ENUM ('ORAL', 'INTRAVENOSA', 'SONDAS', 'HEMODERIVADOS', 'DIETA', 'OUTROS');

-- CreateEnum
CREATE TYPE "FluidOutputType" AS ENUM ('DIURESE', 'DRENO', 'VOMITO', 'SANGRAMENTO', 'EVACUACAO', 'OUTROS');

-- CreateEnum
CREATE TYPE "FluidBalanceStatus" AS ENUM ('EM_ANDAMENTO', 'FECHADO');

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "registeredById" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolicPressure" INTEGER NOT NULL,
    "diastolicPressure" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "heartRate" INTEGER NOT NULL,
    "respiratoryRate" INTEGER NOT NULL,
    "spo2" INTEGER NOT NULL,
    "painScale" INTEGER NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluidBalance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "registeredById" TEXT NOT NULL,
    "dataHoraReferencia" TIMESTAMP(3) NOT NULL,
    "totalInput" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalOutput" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "FluidBalanceStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FluidBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluidEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fluidBalanceId" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "FluidEntryType" NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FluidEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FluidOutput" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fluidBalanceId" TEXT NOT NULL,
    "registeredById" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "FluidOutputType" NOT NULL,
    "volumeMl" DOUBLE PRECISION NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FluidOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BradenAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "registeredById" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sensoryPerception" INTEGER NOT NULL,
    "moisture" INTEGER NOT NULL,
    "activity" INTEGER NOT NULL,
    "mobility" INTEGER NOT NULL,
    "nutrition" INTEGER NOT NULL,
    "frictionShear" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "classificacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BradenAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MorseAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "registeredById" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "historyOfFalling" INTEGER NOT NULL,
    "secondaryDiagnosis" INTEGER NOT NULL,
    "ambulatoryAid" INTEGER NOT NULL,
    "ivTherapy" INTEGER NOT NULL,
    "gait" INTEGER NOT NULL,
    "mentalStatus" INTEGER NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "classificacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MorseAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlasgowAssessment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "registeredById" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eyeOpening" INTEGER NOT NULL,
    "verbalResponse" INTEGER NOT NULL,
    "motorResponse" INTEGER NOT NULL,
    "pupilReactivity" INTEGER,
    "totalScore" INTEGER NOT NULL,
    "classificacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "GlasgowAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VitalSign_tenantId_deletedAt_idx" ON "VitalSign"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "VitalSign_tenantId_patientId_dataHora_idx" ON "VitalSign"("tenantId", "patientId", "dataHora");

-- CreateIndex
CREATE INDEX "VitalSign_tenantId_hospitalizationId_idx" ON "VitalSign"("tenantId", "hospitalizationId");

-- CreateIndex
CREATE INDEX "FluidBalance_tenantId_deletedAt_idx" ON "FluidBalance"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "FluidBalance_tenantId_patientId_dataHoraReferencia_idx" ON "FluidBalance"("tenantId", "patientId", "dataHoraReferencia");

-- CreateIndex
CREATE INDEX "FluidEntry_tenantId_fluidBalanceId_idx" ON "FluidEntry"("tenantId", "fluidBalanceId");

-- CreateIndex
CREATE INDEX "FluidOutput_tenantId_fluidBalanceId_idx" ON "FluidOutput"("tenantId", "fluidBalanceId");

-- CreateIndex
CREATE INDEX "BradenAssessment_tenantId_patientId_dataHora_idx" ON "BradenAssessment"("tenantId", "patientId", "dataHora");

-- CreateIndex
CREATE INDEX "MorseAssessment_tenantId_patientId_dataHora_idx" ON "MorseAssessment"("tenantId", "patientId", "dataHora");

-- CreateIndex
CREATE INDEX "GlasgowAssessment_tenantId_patientId_dataHora_idx" ON "GlasgowAssessment"("tenantId", "patientId", "dataHora");

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidBalance" ADD CONSTRAINT "FluidBalance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidBalance" ADD CONSTRAINT "FluidBalance_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidBalance" ADD CONSTRAINT "FluidBalance_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidBalance" ADD CONSTRAINT "FluidBalance_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidEntry" ADD CONSTRAINT "FluidEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidEntry" ADD CONSTRAINT "FluidEntry_fluidBalanceId_fkey" FOREIGN KEY ("fluidBalanceId") REFERENCES "FluidBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidEntry" ADD CONSTRAINT "FluidEntry_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidOutput" ADD CONSTRAINT "FluidOutput_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidOutput" ADD CONSTRAINT "FluidOutput_fluidBalanceId_fkey" FOREIGN KEY ("fluidBalanceId") REFERENCES "FluidBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FluidOutput" ADD CONSTRAINT "FluidOutput_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BradenAssessment" ADD CONSTRAINT "BradenAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BradenAssessment" ADD CONSTRAINT "BradenAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BradenAssessment" ADD CONSTRAINT "BradenAssessment_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BradenAssessment" ADD CONSTRAINT "BradenAssessment_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorseAssessment" ADD CONSTRAINT "MorseAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorseAssessment" ADD CONSTRAINT "MorseAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorseAssessment" ADD CONSTRAINT "MorseAssessment_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MorseAssessment" ADD CONSTRAINT "MorseAssessment_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasgowAssessment" ADD CONSTRAINT "GlasgowAssessment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasgowAssessment" ADD CONSTRAINT "GlasgowAssessment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasgowAssessment" ADD CONSTRAINT "GlasgowAssessment_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlasgowAssessment" ADD CONSTRAINT "GlasgowAssessment_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
