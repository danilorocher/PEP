-- CreateEnum
CREATE TYPE "SurgicalStatus" AS ENUM ('AGENDADO', 'PRE_OPERATORIO', 'EM_ANDAMENTO', 'RECUPERACAO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "SurgicalPriority" AS ENUM ('ELETIVA', 'URGENCIA', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('SALA', 'EQUIPAMENTO');

-- CreateTable
CREATE TABLE "SurgicalResource" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ResourceType" NOT NULL,
    "disponibilidade" BOOLEAN NOT NULL DEFAULT true,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SurgicalResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurgicalSchedule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medicalRecordId" TEXT,
    "procedimento" TEXT NOT NULL,
    "dataCirurgia" TIMESTAMP(3) NOT NULL,
    "salaId" TEXT NOT NULL,
    "cirurgiaoId" TEXT NOT NULL,
    "anestesistaId" TEXT NOT NULL,
    "enfermeiroId" TEXT NOT NULL,
    "status" "SurgicalStatus" NOT NULL DEFAULT 'AGENDADO',
    "prioridade" "SurgicalPriority" NOT NULL DEFAULT 'ELETIVA',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SurgicalSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreOpChecklist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cirurgiaId" TEXT NOT NULL,
    "profissionalResponsavel" TEXT NOT NULL,
    "pacienteConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "lateralidadeConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "jejumConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "consentimentoAssinado" BOOLEAN NOT NULL DEFAULT false,
    "alergiasVerificadas" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreOpChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnesthesiaRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cirurgiaId" TEXT NOT NULL,
    "anestesistaId" TEXT NOT NULL,
    "tipoAnestesia" TEXT NOT NULL,
    "drogasUtilizadas" JSONB NOT NULL,
    "sinaisVitais" JSONB NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnesthesiaRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurgicalReport" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cirurgiaId" TEXT NOT NULL,
    "cirurgiaoId" TEXT NOT NULL,
    "descricaoProcedimento" TEXT NOT NULL,
    "intercorrencias" TEXT,
    "materiaisUtilizados" TEXT,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurgicalReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OPMEItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "fabricante" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "numeroRegistroAnvisa" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "OPMEItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurgeryOPME" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cirurgiaId" TEXT NOT NULL,
    "opmeId" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "rastreabilidadeConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurgeryOPME_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostOpChecklist" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cirurgiaId" TEXT NOT NULL,
    "profissionalResponsavel" TEXT NOT NULL,
    "nivelConsciencia" TEXT NOT NULL,
    "dor" INTEGER NOT NULL,
    "sinaisVitais" JSONB NOT NULL,
    "liberadoAlta" BOOLEAN NOT NULL DEFAULT false,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostOpChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SurgicalResource_tenantId_tipo_disponibilidade_idx" ON "SurgicalResource"("tenantId", "tipo", "disponibilidade");

-- CreateIndex
CREATE INDEX "SurgicalResource_tenantId_deletedAt_idx" ON "SurgicalResource"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "SurgicalSchedule_tenantId_dataCirurgia_status_idx" ON "SurgicalSchedule"("tenantId", "dataCirurgia", "status");

-- CreateIndex
CREATE INDEX "SurgicalSchedule_tenantId_salaId_dataCirurgia_idx" ON "SurgicalSchedule"("tenantId", "salaId", "dataCirurgia");

-- CreateIndex
CREATE UNIQUE INDEX "PreOpChecklist_cirurgiaId_key" ON "PreOpChecklist"("cirurgiaId");

-- CreateIndex
CREATE INDEX "PreOpChecklist_tenantId_cirurgiaId_idx" ON "PreOpChecklist"("tenantId", "cirurgiaId");

-- CreateIndex
CREATE UNIQUE INDEX "AnesthesiaRecord_cirurgiaId_key" ON "AnesthesiaRecord"("cirurgiaId");

-- CreateIndex
CREATE INDEX "AnesthesiaRecord_tenantId_cirurgiaId_idx" ON "AnesthesiaRecord"("tenantId", "cirurgiaId");

-- CreateIndex
CREATE UNIQUE INDEX "SurgicalReport_cirurgiaId_key" ON "SurgicalReport"("cirurgiaId");

-- CreateIndex
CREATE INDEX "SurgicalReport_tenantId_cirurgiaId_idx" ON "SurgicalReport"("tenantId", "cirurgiaId");

-- CreateIndex
CREATE INDEX "OPMEItem_tenantId_status_idx" ON "OPMEItem"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OPMEItem_tenantId_numeroRegistroAnvisa_lote_key" ON "OPMEItem"("tenantId", "numeroRegistroAnvisa", "lote");

-- CreateIndex
CREATE INDEX "SurgeryOPME_tenantId_cirurgiaId_idx" ON "SurgeryOPME"("tenantId", "cirurgiaId");

-- CreateIndex
CREATE INDEX "SurgeryOPME_tenantId_opmeId_idx" ON "SurgeryOPME"("tenantId", "opmeId");

-- CreateIndex
CREATE UNIQUE INDEX "PostOpChecklist_cirurgiaId_key" ON "PostOpChecklist"("cirurgiaId");

-- CreateIndex
CREATE INDEX "PostOpChecklist_tenantId_cirurgiaId_idx" ON "PostOpChecklist"("tenantId", "cirurgiaId");

-- AddForeignKey
ALTER TABLE "SurgicalResource" ADD CONSTRAINT "SurgicalResource_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "SurgicalResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_cirurgiaoId_fkey" FOREIGN KEY ("cirurgiaoId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_anestesistaId_fkey" FOREIGN KEY ("anestesistaId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalSchedule" ADD CONSTRAINT "SurgicalSchedule_enfermeiroId_fkey" FOREIGN KEY ("enfermeiroId") REFERENCES "Nurse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOpChecklist" ADD CONSTRAINT "PreOpChecklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOpChecklist" ADD CONSTRAINT "PreOpChecklist_cirurgiaId_fkey" FOREIGN KEY ("cirurgiaId") REFERENCES "SurgicalSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOpChecklist" ADD CONSTRAINT "PreOpChecklist_profissionalResponsavel_fkey" FOREIGN KEY ("profissionalResponsavel") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnesthesiaRecord" ADD CONSTRAINT "AnesthesiaRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnesthesiaRecord" ADD CONSTRAINT "AnesthesiaRecord_cirurgiaId_fkey" FOREIGN KEY ("cirurgiaId") REFERENCES "SurgicalSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnesthesiaRecord" ADD CONSTRAINT "AnesthesiaRecord_anestesistaId_fkey" FOREIGN KEY ("anestesistaId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalReport" ADD CONSTRAINT "SurgicalReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalReport" ADD CONSTRAINT "SurgicalReport_cirurgiaId_fkey" FOREIGN KEY ("cirurgiaId") REFERENCES "SurgicalSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgicalReport" ADD CONSTRAINT "SurgicalReport_cirurgiaoId_fkey" FOREIGN KEY ("cirurgiaoId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPMEItem" ADD CONSTRAINT "OPMEItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryOPME" ADD CONSTRAINT "SurgeryOPME_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryOPME" ADD CONSTRAINT "SurgeryOPME_cirurgiaId_fkey" FOREIGN KEY ("cirurgiaId") REFERENCES "SurgicalSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurgeryOPME" ADD CONSTRAINT "SurgeryOPME_opmeId_fkey" FOREIGN KEY ("opmeId") REFERENCES "OPMEItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostOpChecklist" ADD CONSTRAINT "PostOpChecklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostOpChecklist" ADD CONSTRAINT "PostOpChecklist_cirurgiaId_fkey" FOREIGN KEY ("cirurgiaId") REFERENCES "SurgicalSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostOpChecklist" ADD CONSTRAINT "PostOpChecklist_profissionalResponsavel_fkey" FOREIGN KEY ("profissionalResponsavel") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
