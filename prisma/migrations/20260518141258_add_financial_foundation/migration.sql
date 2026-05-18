-- CreateEnum
CREATE TYPE "CostCenterType" AS ENUM ('CLINICO', 'ADMINISTRATIVO', 'APOIO');

-- CreateEnum
CREATE TYPE "AccountingType" AS ENUM ('RECEITA', 'DESPESA', 'ATIVO', 'PASSIVO');

-- CreateEnum
CREATE TYPE "AccountNature" AS ENUM ('DEVEDORA', 'CREDORA');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TransactionNature" AS ENUM ('CONVENIO', 'PARTICULAR', 'SUS', 'CUSTO_OPERACIONAL', 'SALARIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDENTE', 'APROVADO', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'TED', 'DOC', 'CHEQUE', 'CONVENIO', 'SUS');

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "CostCenterType" NOT NULL,
    "codigoPai" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChartOfAccounts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "AccountingType" NOT NULL,
    "natureza" "AccountNature" NOT NULL,
    "codigoPai" TEXT,
    "aceitaLancamento" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChartOfAccounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "TransactionType" NOT NULL,
    "natureza" "TransactionNature" NOT NULL,
    "chartAccountId" TEXT NOT NULL,
    "costCenterId" TEXT,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataCompetencia" TIMESTAMP(3) NOT NULL,
    "dataVencimento" TIMESTAMP(3),
    "dataPagamento" TIMESTAMP(3),
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDENTE',
    "origemTipo" TEXT,
    "origemId" TEXT,
    "numeroDocumento" TEXT,
    "formaPagamento" "PaymentMethod",
    "observacoes" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "aprovadoPorId" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CostCenter_tenantId_deletedAt_idx" ON "CostCenter"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "CostCenter_tenantId_tipo_deletedAt_idx" ON "CostCenter"("tenantId", "tipo", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_tenantId_codigo_key" ON "CostCenter"("tenantId", "codigo");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_tenantId_tipo_deletedAt_idx" ON "ChartOfAccounts"("tenantId", "tipo", "deletedAt");

-- CreateIndex
CREATE INDEX "ChartOfAccounts_tenantId_deletedAt_idx" ON "ChartOfAccounts"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccounts_tenantId_codigo_key" ON "ChartOfAccounts"("tenantId", "codigo");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_tipo_status_deletedAt_idx" ON "FinancialTransaction"("tenantId", "tipo", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_dataCompetencia_deletedAt_idx" ON "FinancialTransaction"("tenantId", "dataCompetencia", "deletedAt");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_chartAccountId_deletedAt_idx" ON "FinancialTransaction"("tenantId", "chartAccountId", "deletedAt");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_costCenterId_deletedAt_idx" ON "FinancialTransaction"("tenantId", "costCenterId", "deletedAt");

-- CreateIndex
CREATE INDEX "FinancialTransaction_tenantId_origemTipo_origemId_idx" ON "FinancialTransaction"("tenantId", "origemTipo", "origemId");

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChartOfAccounts" ADD CONSTRAINT "ChartOfAccounts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_chartAccountId_fkey" FOREIGN KEY ("chartAccountId") REFERENCES "ChartOfAccounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
