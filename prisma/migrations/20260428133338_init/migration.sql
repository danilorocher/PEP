-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('BASIC', 'STANDARD', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MEDICO', 'ENFERMEIRO', 'RECEPCIONISTA', 'FATURAMENTO', 'PACIENTE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "NurseCategory" AS ENUM ('ENFERMEIRO', 'TECNICO', 'AUXILIAR');

-- CreateEnum
CREATE TYPE "WardType" AS ENUM ('UTI', 'ENFERMARIA', 'EMERGENCIA', 'AMBULATORIO', 'CIRURGICO', 'PEDIATRIA', 'MATERNIDADE');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('UTI', 'CLINICO', 'ISOLAMENTO', 'PEDIATRICO', 'CIRURGICO');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('LIVRE', 'OCUPADO', 'MANUTENCAO', 'RESERVADO');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO', 'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ATIVO', 'INATIVO', 'OBITO');

-- CreateEnum
CREATE TYPE "InsuranceType" AS ENUM ('PLANO_SAUDE', 'CONVENIO', 'PARTICULAR', 'SUS');

-- CreateEnum
CREATE TYPE "PharmaForm" AS ENUM ('COMPRIMIDO', 'CAPSULA', 'INJETAVEL', 'SOLUCAO', 'XAROPE', 'CREME', 'SUPOSITORIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "AdminRoute" AS ENUM ('ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA', 'INALATORIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('LABORATORIAL', 'IMAGEM', 'FUNCIONAL', 'OUTRO');

-- CreateEnum
CREATE TYPE "MedRecordStatus" AS ENUM ('ABERTO', 'FECHADO', 'ARQUIVADO');

-- CreateEnum
CREATE TYPE "ProfType" AS ENUM ('MEDICO', 'ENFERMEIRO', 'FISIOTERAPEUTA', 'OUTRO');

-- CreateEnum
CREATE TYPE "PrescStatus" AS ENUM ('ATIVA', 'SUSPENSA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ATIVO', 'SUSPENSO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "MedAdminStatus" AS ENUM ('MINISTRADO', 'ATRASADO', 'NAO_MINISTRADO', 'RECUSADO_PACIENTE');

-- CreateEnum
CREATE TYPE "UrgencyType" AS ENUM ('ROTINA', 'URGENTE', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "ExamReqStatus" AS ENUM ('SOLICITADO', 'COLETADO', 'EM_ANALISE', 'CONCLUIDO', 'CANCELADA');

-- CreateEnum
CREATE TYPE "HospType" AS ENUM ('ELETIVA', 'URGENCIA', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "AccomodationType" AS ENUM ('ENFERMARIA', 'APARTAMENTO', 'UTI');

-- CreateEnum
CREATE TYPE "DischargeCondition" AS ENUM ('ALTA_MELHORADO', 'ALTA_CURADO', 'ALTA_PEDIDO', 'OBITO', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "HospStatus" AS ENUM ('ATIVA', 'ALTA', 'TRANSFERIDO', 'OBITO');

-- CreateEnum
CREATE TYPE "ApptType" AS ENUM ('CONSULTA', 'RETORNO', 'EXAME', 'PROCEDIMENTO');

-- CreateEnum
CREATE TYPE "ApptStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'REALIZADO', 'CANCELADO', 'FALTOU');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('INTERNACAO', 'CONSULTA', 'SADT');

-- CreateEnum
CREATE TYPE "BillingGuideStatus" AS ENUM ('RASCUNHO', 'ENVIADA', 'AUTORIZADA', 'NEGADA', 'PAGA', 'GLOSADA');

-- CreateEnum
CREATE TYPE "BillingItemStatus" AS ENUM ('AUTORIZADO', 'GLOSADO');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "cnpj" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "enderecoCompleto" JSONB,
    "plano" "PlanType" NOT NULL DEFAULT 'BASIC',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "configuracoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "permissoes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "sexo" "Gender",
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "enderecoCompleto" JSONB,
    "password" TEXT NOT NULL,
    "roleName" "UserRole" NOT NULL DEFAULT 'RECEPCIONISTA',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dataAdmissao" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcesso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "dadosAnteriores" JSONB,
    "dadosNovos" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT,
    "crm" TEXT NOT NULL,
    "ufCrm" TEXT NOT NULL,
    "dataExpedicaoCrm" TIMESTAMP(3),
    "cns" TEXT,
    "cnsHash" TEXT,
    "telefoneProfissional" TEXT,
    "emailProfissional" TEXT,
    "registroSecundario" TEXT,
    "assinaturaDigitalPath" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigoCBOS" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorSpecialty" (
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "DoctorSpecialty_pkey" PRIMARY KEY ("doctorId","specialtyId")
);

-- CreateTable
CREATE TABLE "Nurse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT,
    "coren" TEXT NOT NULL,
    "ufCoren" TEXT NOT NULL,
    "dataExpedicaoCoren" TIMESTAMP(3),
    "categoria" "NurseCategory" NOT NULL,
    "cns" TEXT,
    "cnsHash" TEXT,
    "podePrescrever" BOOLEAN NOT NULL DEFAULT false,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Nurse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "WardType" NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "andar" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" "BedType" NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'LIVRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "registroANS" TEXT,
    "tipo" "InsuranceType" NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cid10" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "descricaoAbreviada" TEXT,
    "capitulo" TEXT,
    "grupo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cid10_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT,
    "concentracao" TEXT,
    "formaFarmaceutica" "PharmaForm" NOT NULL,
    "fabricante" TEXT,
    "codigoInterno" TEXT,
    "codigoEAN" TEXT,
    "controleEspecial" BOOLEAN NOT NULL DEFAULT false,
    "viaAdministracaoPadrao" "AdminRoute" NOT NULL,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "ExamType" NOT NULL,
    "tempoMedioResultado" INTEGER,
    "preparacaoNecessaria" TEXT,
    "codigoInterno" TEXT,
    "codigoTUSS" TEXT,
    "status" "EntityStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "convenioId" TEXT,
    "nomeCompleto" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cpfHash" TEXT,
    "cns" TEXT,
    "cnsHash" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "sexo" "Gender" NOT NULL,
    "nomeMae" TEXT,
    "nomePai" TEXT,
    "enderecoCompleto" JSONB,
    "telefone" TEXT,
    "contatoEmergencia" JSONB,
    "numeroCarteirinha" TEXT,
    "dataValidadeCarteirinha" TIMESTAMP(3),
    "alergias" TEXT[],
    "comorbidades" TEXT[],
    "historicoClinico" TEXT,
    "grupoSanguineo" "BloodGroup",
    "status" "PatientStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" TIMESTAMP(3),
    "status" "MedRecordStatus" NOT NULL DEFAULT 'ABERTO',
    "responsavelAberturaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "profissionalId" TEXT NOT NULL,
    "cid10Id" TEXT,
    "tipoProfissional" "ProfType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "assinadoDigitalmente" BOOLEAN NOT NULL DEFAULT false,
    "assinaturaHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicalEvolution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalEvolutionHistory" (
    "id" TEXT NOT NULL,
    "evolutionId" TEXT NOT NULL,
    "versao" INTEGER NOT NULL,
    "dadosSnapshot" JSONB NOT NULL,
    "alteradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalEvolutionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "prescritoPor" TEXT NOT NULL,
    "tipoPrescrito" "ProfType" NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PrescStatus" NOT NULL DEFAULT 'ATIVA',
    "observacoes" TEXT,
    "assinadaDigitalmente" BOOLEAN NOT NULL DEFAULT false,
    "assinaturaHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrescriptionItem" (
    "id" TEXT NOT NULL,
    "prescriptionId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "dosagem" TEXT NOT NULL,
    "viaAdministracao" "AdminRoute" NOT NULL,
    "frequencia" TEXT NOT NULL,
    "horariosProgramados" TEXT[],
    "duracaoDias" INTEGER,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "observacoes" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationAdministration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prescriptionItemId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "administradoPor" TEXT,
    "dataHoraProgamada" TIMESTAMP(3) NOT NULL,
    "dataHoraAdministrada" TIMESTAMP(3),
    "status" "MedAdminStatus" NOT NULL DEFAULT 'NAO_MINISTRADO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MedicationAdministration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "solicitadoPor" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "cid10Id" TEXT,
    "dataHoraSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "urgencia" "UrgencyType" NOT NULL DEFAULT 'ROTINA',
    "status" "ExamReqStatus" NOT NULL DEFAULT 'SOLICITADO',
    "resultado" TEXT,
    "dataHoraResultado" TIMESTAMP(3),
    "observacoes" TEXT,
    "codigoAutorizacaoConvenio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExamRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospitalization" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "medicoResponsavelId" TEXT NOT NULL,
    "cid10AdmissaoId" TEXT NOT NULL,
    "cid10AltaId" TEXT,
    "convenioId" TEXT,
    "medicoAltaId" TEXT,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaAlta" TIMESTAMP(3),
    "dataAlta" TIMESTAMP(3),
    "motivoInternacao" TEXT NOT NULL,
    "tipoInternacao" "HospType" NOT NULL,
    "tipoAcomodacao" "AccomodationType" NOT NULL,
    "numeroGuiaInternacao" TEXT,
    "sumarioAlta" TEXT,
    "condicaoPacienteAlta" "DischargeCondition",
    "status" "HospStatus" NOT NULL DEFAULT 'ATIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Hospitalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "convenioId" TEXT,
    "cid10Id" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER NOT NULL,
    "tipo" "ApptType" NOT NULL,
    "status" "ApptStatus" NOT NULL DEFAULT 'AGENDADO',
    "motivoCancelamento" TEXT,
    "numeroGuiaConsulta" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingGuide" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "convenioId" TEXT NOT NULL,
    "hospitalizationId" TEXT,
    "appointmentId" TEXT,
    "tipo" "BillingType" NOT NULL,
    "numeroGuia" TEXT,
    "dataEmissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAutorizacao" TIMESTAMP(3),
    "codigoAutorizacao" TEXT,
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "status" "BillingGuideStatus" NOT NULL DEFAULT 'RASCUNHO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BillingGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingItem" (
    "id" TEXT NOT NULL,
    "billingGuideId" TEXT NOT NULL,
    "examId" TEXT,
    "medicationId" TEXT,
    "procedimentoDescricao" TEXT NOT NULL,
    "codigoTUSS" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "status" "BillingItemStatus" NOT NULL DEFAULT 'AUTORIZADO',
    "motivoGlosa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BillingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE INDEX "Tenant_deletedAt_idx" ON "Tenant"("deletedAt");

-- CreateIndex
CREATE INDEX "Role_tenantId_deletedAt_idx" ON "Role"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_nome_tenantId_key" ON "Role"("nome", "tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_deletedAt_idx" ON "User"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "User_tenantId_cpfHash_deletedAt_idx" ON "User"("tenantId", "cpfHash", "deletedAt");

-- CreateIndex
CREATE INDEX "User_tenantId_email_deletedAt_idx" ON "User"("tenantId", "email", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_tenantId_key" ON "User"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpfHash_tenantId_key" ON "User"("cpfHash", "tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_entidade_entidadeId_idx" ON "AuditLog"("tenantId", "entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_userId_idx" ON "AuditLog"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

-- CreateIndex
CREATE INDEX "Doctor_tenantId_deletedAt_idx" ON "Doctor"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Doctor_tenantId_crm_deletedAt_idx" ON "Doctor"("tenantId", "crm", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_crm_ufCrm_tenantId_key" ON "Doctor"("crm", "ufCrm", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_cpfHash_tenantId_key" ON "Doctor"("cpfHash", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_nome_key" ON "Specialty"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Nurse_userId_key" ON "Nurse"("userId");

-- CreateIndex
CREATE INDEX "Nurse_tenantId_deletedAt_idx" ON "Nurse"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Nurse_tenantId_coren_deletedAt_idx" ON "Nurse"("tenantId", "coren", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Nurse_coren_ufCoren_tenantId_key" ON "Nurse"("coren", "ufCoren", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Nurse_cpfHash_tenantId_key" ON "Nurse"("cpfHash", "tenantId");

-- CreateIndex
CREATE INDEX "Ward_tenantId_deletedAt_idx" ON "Ward"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Ward_tenantId_status_deletedAt_idx" ON "Ward"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Bed_tenantId_deletedAt_idx" ON "Bed"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Bed_tenantId_wardId_deletedAt_idx" ON "Bed"("tenantId", "wardId", "deletedAt");

-- CreateIndex
CREATE INDEX "Bed_tenantId_status_deletedAt_idx" ON "Bed"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bed_numero_wardId_tenantId_key" ON "Bed"("numero", "wardId", "tenantId");

-- CreateIndex
CREATE INDEX "Insurance_tenantId_deletedAt_idx" ON "Insurance"("tenantId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cid10_codigo_key" ON "Cid10"("codigo");

-- CreateIndex
CREATE INDEX "Medication_tenantId_deletedAt_idx" ON "Medication"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Exam_tenantId_deletedAt_idx" ON "Exam"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Patient_tenantId_deletedAt_idx" ON "Patient"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Patient_tenantId_cpfHash_deletedAt_idx" ON "Patient"("tenantId", "cpfHash", "deletedAt");

-- CreateIndex
CREATE INDEX "Patient_tenantId_nomeCompleto_deletedAt_idx" ON "Patient"("tenantId", "nomeCompleto", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_cpfHash_tenantId_key" ON "Patient"("cpfHash", "tenantId");

-- CreateIndex
CREATE INDEX "MedicalRecord_tenantId_deletedAt_idx" ON "MedicalRecord"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "MedicalRecord_tenantId_patientId_deletedAt_idx" ON "MedicalRecord"("tenantId", "patientId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalRecord_numero_tenantId_key" ON "MedicalRecord"("numero", "tenantId");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_tenantId_deletedAt_idx" ON "ClinicalEvolution"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_tenantId_medicalRecordId_deletedAt_idx" ON "ClinicalEvolution"("tenantId", "medicalRecordId", "deletedAt");

-- CreateIndex
CREATE INDEX "ClinicalEvolution_tenantId_profissionalId_deletedAt_idx" ON "ClinicalEvolution"("tenantId", "profissionalId", "deletedAt");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_deletedAt_idx" ON "Prescription"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Prescription_tenantId_medicalRecordId_deletedAt_idx" ON "Prescription"("tenantId", "medicalRecordId", "deletedAt");

-- CreateIndex
CREATE INDEX "PrescriptionItem_prescriptionId_deletedAt_idx" ON "PrescriptionItem"("prescriptionId", "deletedAt");

-- CreateIndex
CREATE INDEX "MedicationAdministration_tenantId_deletedAt_idx" ON "MedicationAdministration"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "MedicationAdministration_tenantId_hospitalizationId_deleted_idx" ON "MedicationAdministration"("tenantId", "hospitalizationId", "deletedAt");

-- CreateIndex
CREATE INDEX "MedicationAdministration_status_dataHoraProgamada_deletedAt_idx" ON "MedicationAdministration"("status", "dataHoraProgamada", "deletedAt");

-- CreateIndex
CREATE INDEX "ExamRequest_tenantId_deletedAt_idx" ON "ExamRequest"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "ExamRequest_tenantId_patientId_deletedAt_idx" ON "ExamRequest"("tenantId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "ExamRequest_tenantId_status_deletedAt_idx" ON "ExamRequest"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Hospitalization_tenantId_deletedAt_idx" ON "Hospitalization"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Hospitalization_tenantId_patientId_deletedAt_idx" ON "Hospitalization"("tenantId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "Hospitalization_tenantId_status_deletedAt_idx" ON "Hospitalization"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_deletedAt_idx" ON "Appointment"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_doctorId_dataHora_deletedAt_idx" ON "Appointment"("tenantId", "doctorId", "dataHora", "deletedAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_patientId_deletedAt_idx" ON "Appointment"("tenantId", "patientId", "deletedAt");

-- CreateIndex
CREATE INDEX "Appointment_tenantId_status_deletedAt_idx" ON "Appointment"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "BillingGuide_tenantId_deletedAt_idx" ON "BillingGuide"("tenantId", "deletedAt");

-- CreateIndex
CREATE INDEX "BillingGuide_tenantId_status_deletedAt_idx" ON "BillingGuide"("tenantId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "BillingGuide_tenantId_convenioId_deletedAt_idx" ON "BillingGuide"("tenantId", "convenioId", "deletedAt");

-- CreateIndex
CREATE INDEX "BillingItem_billingGuideId_deletedAt_idx" ON "BillingItem"("billingGuideId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorSpecialty" ADD CONSTRAINT "DoctorSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nurse" ADD CONSTRAINT "Nurse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Insurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_responsavelAberturaId_fkey" FOREIGN KEY ("responsavelAberturaId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolution" ADD CONSTRAINT "ClinicalEvolution_cid10Id_fkey" FOREIGN KEY ("cid10Id") REFERENCES "Cid10"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalEvolutionHistory" ADD CONSTRAINT "ClinicalEvolutionHistory_evolutionId_fkey" FOREIGN KEY ("evolutionId") REFERENCES "ClinicalEvolution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_prescritoPor_fkey" FOREIGN KEY ("prescritoPor") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrescriptionItem" ADD CONSTRAINT "PrescriptionItem_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_prescriptionItemId_fkey" FOREIGN KEY ("prescriptionItemId") REFERENCES "PrescriptionItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationAdministration" ADD CONSTRAINT "MedicationAdministration_administradoPor_fkey" FOREIGN KEY ("administradoPor") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_solicitadoPor_fkey" FOREIGN KEY ("solicitadoPor") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRequest" ADD CONSTRAINT "ExamRequest_cid10Id_fkey" FOREIGN KEY ("cid10Id") REFERENCES "Cid10"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "MedicalRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_medicoResponsavelId_fkey" FOREIGN KEY ("medicoResponsavelId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_medicoAltaId_fkey" FOREIGN KEY ("medicoAltaId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_cid10AdmissaoId_fkey" FOREIGN KEY ("cid10AdmissaoId") REFERENCES "Cid10"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_cid10AltaId_fkey" FOREIGN KEY ("cid10AltaId") REFERENCES "Cid10"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Insurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Insurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_cid10Id_fkey" FOREIGN KEY ("cid10Id") REFERENCES "Cid10"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGuide" ADD CONSTRAINT "BillingGuide_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGuide" ADD CONSTRAINT "BillingGuide_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGuide" ADD CONSTRAINT "BillingGuide_convenioId_fkey" FOREIGN KEY ("convenioId") REFERENCES "Insurance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGuide" ADD CONSTRAINT "BillingGuide_hospitalizationId_fkey" FOREIGN KEY ("hospitalizationId") REFERENCES "Hospitalization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingGuide" ADD CONSTRAINT "BillingGuide_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingItem" ADD CONSTRAINT "BillingItem_billingGuideId_fkey" FOREIGN KEY ("billingGuideId") REFERENCES "BillingGuide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingItem" ADD CONSTRAINT "BillingItem_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingItem" ADD CONSTRAINT "BillingItem_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
