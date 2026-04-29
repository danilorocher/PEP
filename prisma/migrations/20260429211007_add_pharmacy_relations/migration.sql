-- CreateEnum
CREATE TYPE "DispensationStatus" AS ENUM ('PENDENTE', 'SEPARADA', 'DISPENSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ControlledOperation" AS ENUM ('ENTRADA', 'SAIDA', 'PERDA', 'DEVOLUCAO');

-- CreateEnum
CREATE TYPE "InteractionSeverity" AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'CONTRAINDICADA');

-- CreateEnum
CREATE TYPE "KardexAction" AS ENUM ('PRESCRITO', 'VALIDADO', 'DISPENSADO', 'ADMINISTRADO', 'SUSPENSO', 'DEVOLVIDO');

-- CreateTable
CREATE TABLE "MedicationStock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "localizacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MedicationStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationDispensation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "farmaceuticoId" TEXT,
    "status" "DispensationStatus" NOT NULL DEFAULT 'PENDENTE',
    "dataHoraDispensa" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MedicationDispensation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensationItem" (
    "id" TEXT NOT NULL,
    "dispensationId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "quantidadeDispensada" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DispensationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlledMedicationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "stockId" TEXT,
    "pacienteId" TEXT,
    "responsavelId" TEXT NOT NULL,
    "tipoOperacao" "ControlledOperation" NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "justificativa" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlledMedicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugInteraction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicationAId" TEXT NOT NULL,
    "medicationBId" TEXT NOT NULL,
    "grauSeveridade" "InteractionSeverity" NOT NULL,
    "descricao" TEXT NOT NULL,
    "manejoClinico" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DrugInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationKardex" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "acao" "KardexAction" NOT NULL,
    "detalhes" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationKardex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicationStock_tenantId_medicationId_idx" ON "MedicationStock"("tenantId", "medicationId");

-- CreateIndex
CREATE INDEX "MedicationStock_tenantId_validade_idx" ON "MedicationStock"("tenantId", "validade");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationStock_medicationId_lote_localizacao_tenantId_key" ON "MedicationStock"("medicationId", "lote", "localizacao", "tenantId");

-- CreateIndex
CREATE INDEX "MedicationDispensation_tenantId_status_idx" ON "MedicationDispensation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MedicationDispensation_tenantId_prescriptionId_idx" ON "MedicationDispensation"("tenantId", "prescriptionId");

-- CreateIndex
CREATE INDEX "DispensationItem_dispensationId_idx" ON "DispensationItem"("dispensationId");

-- CreateIndex
CREATE INDEX "DispensationItem_prescriptionItemId_idx" ON "DispensationItem"("prescriptionItemId");

-- CreateIndex
CREATE INDEX "ControlledMedicationLog_tenantId_medicationId_idx" ON "ControlledMedicationLog"("tenantId", "medicationId");

-- CreateIndex
CREATE INDEX "ControlledMedicationLog_tenantId_dataHora_idx" ON "ControlledMedicationLog"("tenantId", "dataHora");

-- CreateIndex
CREATE INDEX "DrugInteraction_tenantId_idx" ON "DrugInteraction"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "DrugInteraction_medicationAId_medicationBId_tenantId_key" ON "DrugInteraction"("medicationAId", "medicationBId", "tenantId");

-- CreateIndex
CREATE INDEX "MedicationKardex_tenantId_patientId_dataHora_idx" ON "MedicationKardex"("tenantId", "patientId", "dataHora");

-- CreateIndex
CREATE INDEX "MedicationKardex_tenantId_medicalRecordId_idx" ON "MedicationKardex"("tenantId", "medicalRecordId");

-- AddForeignKey
ALTER TABLE "MedicationStock" ADD CONSTRAINT "MedicationStock_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationStock" ADD CONSTRAINT "MedicationStock_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDispensation" ADD CONSTRAINT "MedicationDispensation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDispensation" ADD CONSTRAINT "MedicationDispensation_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDispensation" ADD CONSTRAINT "MedicationDispensation_farmaceuticoId_fkey" FOREIGN KEY ("farmaceuticoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensationItem" ADD CONSTRAINT "DispensationItem_dispensationId_fkey" FOREIGN KEY ("dispensationId") REFERENCES "MedicationDispensation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensationItem" ADD CONSTRAINT "DispensationItem_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensationItem" ADD CONSTRAINT "DispensationItem_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MedicationStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledMedicationLog" ADD CONSTRAINT "ControlledMedicationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledMedicationLog" ADD CONSTRAINT "ControlledMedicationLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledMedicationLog" ADD CONSTRAINT "ControlledMedicationLog_stockId_fkey" FOREIGN KEY ("stockId") REFERENCES "MedicationStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledMedicationLog" ADD CONSTRAINT "ControlledMedicationLog_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ControlledMedicationLog" ADD CONSTRAINT "ControlledMedicationLog_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_medicationAId_fkey" FOREIGN KEY ("medicationAId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrugInteraction" ADD CONSTRAINT "DrugInteraction_medicationBId_fkey" FOREIGN KEY ("medicationBId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationKardex" ADD CONSTRAINT "MedicationKardex_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationKardex" ADD CONSTRAINT "MedicationKardex_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationKardex" ADD CONSTRAINT "MedicationKardex_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationKardex" ADD CONSTRAINT "MedicationKardex_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationKardex" ADD CONSTRAINT "MedicationKardex_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
