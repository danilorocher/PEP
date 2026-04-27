# PEP+ — PROMPTS POR FASE (VERSÃO CORRIGIDA E COMPLETA)

> **Como usar:** Envie um prompt por vez ao Gemini Pro. Aguarde a entrega completa de cada fase antes de avançar. Cada fase depende da anterior.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 1 — ARQUITETURA BASE E INFRAESTRUTURA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crie a estrutura base de um sistema SaaS completo chamado **PEP+** (Prontuário Eletrônico de Pacientes), com nível profissional, inspirado em sistemas como Wareline, MV Soul e Tasy, preparado para uso real em clínicas e hospitais brasileiros.

## 🧱 TECNOLOGIAS OBRIGATÓRIAS

- **Backend:** Node.js com NestJS
- **Banco de dados:** PostgreSQL
- **ORM:** Prisma
- **Autenticação:** JWT com Refresh Token
- **Controle de acesso:** RBAC avançado
- **Cache e sessões:** Redis (obrigatório — usar para cache de sessões JWT, dados frequentes como prontuários e relatórios)
- **Filas assíncronas:** BullMQ com Redis (obrigatório — para notificações de medicação, geração de relatórios, envio de e-mails)
- **Documentação:** Swagger (@nestjs/swagger com decorators em todos os DTOs)
- **Containerização:** Docker + Docker Compose (obrigatório para consistência de ambiente e deploy)

## ☁️ ARQUITETURA SaaS (MULTI-TENANT)

- Sistema multiempresa (multi-tenant) com estratégia **shared database / shared schema**
- Isolamento completo por `tenantId` em todas as tabelas
- Cada empresa (hospital/clínica) possui: usuários próprios, pacientes próprios, estrutura hospitalar isolada
- **Identificação do tenant:** via subdomínio (ex: `clinica-abc.pep.com`) extraído no guard de autenticação e injetado automaticamente em todas as queries via middleware global
- **Rate limiting por tenant:** cada tenant tem limite de requisições independente (usar `@nestjs/throttler` com chave composta `tenantId:ip`)
- Middleware global que extrai e valida o `tenantId` em cada request antes de chegar nos controllers

## 📁 ESTRUTURA DO PROJETO (NestJS — Clean Architecture)

Organizar seguindo Clean Architecture com as seguintes camadas bem separadas:

```
src/
  modules/
    auth/
    users/
    roles/
    companies/
    doctors/
    nurses/
    patients/
    wards/
    beds/
    medications/
    exams/
    medical-records/
    prescriptions/
    hospitalizations/
    appointments/       ← NOVO: agendamento de consultas
    audit/
    reports/
    billing/            ← NOVO: faturamento/convênios
  shared/
    domain/             ← Entidades de domínio puras (sem dependência do Prisma)
    application/        ← Use cases / application services
    infrastructure/     ← Implementações concretas (Prisma, Redis, BullMQ)
    guards/
    decorators/
    interceptors/
    filters/
    pipes/
  config/
  queues/               ← Workers BullMQ
```

**Regra obrigatória de Clean Architecture:**
- As entidades de domínio em `shared/domain/` NÃO devem importar o Prisma Client diretamente
- Os use cases em `shared/application/` dependem de interfaces de repositório (ports), não de implementações concretas
- As implementações Prisma ficam em `shared/infrastructure/` e implementam as interfaces dos repositórios

## 🐳 DOCKER COMPOSE

Criar `docker-compose.yml` com os seguintes serviços:

```yaml
services:
  api:         # NestJS app
  postgres:    # PostgreSQL 15
  redis:       # Redis 7 (usado por BullMQ e cache de sessão)
  bull-board:  # Dashboard visual para monitoramento das filas BullMQ
```

Incluir:
- `.env.example` com todas as variáveis necessárias documentadas
- `Dockerfile` multi-stage (build + production)
- Health checks para postgres e redis
- Volume persistente para postgres

## 🔐 AUTENTICAÇÃO E SEGURANÇA

- Tela de login
- Criar automaticamente usuário administrador padrão **apenas para seed de desenvolvimento**:
  - email: `admin@pep.com`
  - senha: `Admin@2024!` (senha forte mesmo em dev)
  - **ATENÇÃO:** O sistema deve exigir troca obrigatória de senha no primeiro acesso em produção (flag `mustChangePassword: true` na entidade User)
- Senhas criptografadas com **bcrypt** (custo mínimo 12)
- Controle de sessão com JWT (access token 15min) + Refresh Token (7 dias, rotativo, armazenado no Redis)
- Logs de acesso: login, logout, tentativas falhas, troca de senha
- **Rate limiting de login:** máximo 5 tentativas por IP por minuto (bloqueio progressivo)
- **Criptografia de dados sensíveis em repouso:** os campos CPF, CNS e dados de diagnóstico devem ser armazenados criptografados no banco usando AES-256-GCM. Criar um `EncryptionService` reutilizável no módulo shared para criptografar/descriptografar esses campos antes de salvar/ler do Prisma.

## ✅ ENTREGÁVEIS DESTA FASE

1. Estrutura de pastas completa do projeto
2. `docker-compose.yml` funcional
3. `Dockerfile` multi-stage
4. `.env.example` documentado
5. Módulo de configuração (`@nestjs/config`) com validação de variáveis por Joi/Zod
6. Middleware de extração de tenant
7. Guard de autenticação JWT
8. Guard de RBAC
9. Interceptor global de auditoria (registra toda ação no sistema)
10. Módulo Redis configurado (cache + BullMQ)
11. Swagger configurado com autenticação Bearer
12. `EncryptionService` para dados sensíveis

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 2 — SCHEMA PRISMA COMPLETO (BANCO DE DADOS)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com a estrutura base da Fase 1 criada, crie o **schema Prisma completo e de nível produção** para o sistema PEP+. Este schema deve estar pronto para uso real em hospitais e clínicas brasileiras.

## 🧪 REGRAS GERAIS DO SCHEMA

- Usar **UUID** em todos os campos `id`
- Todos os modelos devem ter `createdAt`, `updatedAt` e `deletedAt` (soft delete)
- Todos os modelos devem ter `tenantId` (multi-tenant)
- Relacionamentos bem definidos com Foreign Keys explícitas
- Índices para performance em campos de busca frequente (CPF, CRM, COREN, CNS, tenantId, pacienteId)
- Constraints **UNIQUE** compostos onde necessário (ex: CPF único por tenant, CRM único por UF)

## 📐 MODELOS OBRIGATÓRIOS

### Tenant / Empresa
```
Company: id, nome, cnpj, email, telefone, endereço (completo), plano (enum: BASIC, STANDARD, ENTERPRISE), status, logoUrl, configurações (Json), createdAt, updatedAt, deletedAt
```

### Usuários e Acesso
```
User: id, tenantId, nomeCompleto, cpf (criptografado), dataNascimento, sexo (enum), email, telefone, endereçoCompleto, roleId, status (enum: ATIVO, INATIVO), dataAdmissao, mustChangePassword, ultimoAcesso, createdAt, updatedAt, deletedAt

Role: id, tenantId, nome, permissões (Json com todas as flags RBAC), createdAt, updatedAt, deletedAt

AuditLog: id, tenantId, userId, ação, entidade, entidadeId, dadosAnteriores (Json), dadosNovos (Json), ip, userAgent, createdAt
```

### Médicos
```
Doctor: id, tenantId, userId (FK opcional — médico pode ter login), nomeCompleto, cpf (criptografado), crm, ufCrm, dataExpedicaoCrm, cns (criptografado), especialidades (relação N:N com Specialty), telefoneProfissional, emailProfissional, registroSecundario, assinaturaDigitalPath, status, createdAt, updatedAt, deletedAt

Specialty: id, nome, codigoCBOS (código CBO para faturamento), createdAt, updatedAt
DoctorSpecialty: doctorId, specialtyId (tabela de junção N:N)
```

### Enfermeiros
```
Nurse: id, tenantId, userId (FK opcional), nomeCompleto, cpf (criptografado), coren, ufCoren, dataExpedicaoCoren, categoria (enum: ENFERMEIRO, TECNICO, AUXILIAR), cns (criptografado), podePrescrever (Boolean), status, createdAt, updatedAt, deletedAt
```

### Estrutura Hospitalar
```
Ward: id, tenantId, nome, tipo (enum: UTI, ENFERMARIA, EMERGENCIA, AMBULATORIO, CIRURGICO, PEDIATRIA, MATERNIDADE), capacidade, andar, status, createdAt, updatedAt, deletedAt

Bed: id, tenantId, wardId, numero, tipo (enum: UTI, CLINICO, ISOLAMENTO, PEDIATRICO, CIRURGICO), status (enum: LIVRE, OCUPADO, MANUTENCAO, RESERVADO), createdAt, updatedAt, deletedAt
```

### Pacientes
```
Patient: id, tenantId, nomeCompleto, cpf (criptografado, unique por tenant), cns (criptografado), dataNascimento, sexo (enum), nomeMae, nomePai, endereçoCompleto (Json), telefone, contatoEmergencia (Json: nome, telefone, parentesco), convenioId (FK opcional), numeroCarteirinha, dataValidadeCarteirinha, alergias (String[]), comorbidades (String[]), historicoClinico, grupoSanguineo (enum), status (enum: ATIVO, INATIVO, OBITO), createdAt, updatedAt, deletedAt

Insurance: id, tenantId, nome, registroANS, tipo (enum: PLANO_SAUDE, CONVENIO, PARTICULAR, SUS), telefone, email, status, createdAt, updatedAt, deletedAt
```

### Medicamentos
```
Medication: id, tenantId, nome, principioAtivo, concentracao, formaFarmaceutica (enum: COMPRIMIDO, CAPSULA, INJETAVEL, SOLUCAO, XAROPE, CREME, SUPOSITORIO, OUTRO), fabricante, codigoInterno, codigoEAN, controleEspecial (Boolean), viaAdministracaoPadrao (enum: ORAL, INTRAVENOSA, INTRAMUSCULAR, SUBCUTANEA, TOPICA, INALATORIA, OUTRO), status, createdAt, updatedAt, deletedAt
```

### Exames
```
Exam: id, tenantId, nome, tipo (enum: LABORATORIAL, IMAGEM, FUNCIONAL, OUTRO), tempoMedioResultado (em horas), preparacaoNecessaria, codigoInterno, codigoTUSS (obrigatório para convênios), status, createdAt, updatedAt, deletedAt
```

### CID-10
```
Cid10: id, codigo (ex: J18.9), descricao, descricaoAbreviada, capitulo, grupo — esta tabela deve ser populada via seed com a tabela oficial CID-10 do DATASUS

OBSERVAÇÃO: CID-10 é OBRIGATÓRIO para diagnósticos, internações, prescrições e faturamento no Brasil. Sem ele o sistema não tem validade para uso real.
```

### Prontuário Eletrônico (núcleo)
```
MedicalRecord: id, tenantId, patientId, numero (gerado automaticamente, único por tenant), abertoEm, fechadoEm, status (enum: ABERTO, FECHADO, ARQUIVADO), responsavelAberturaId, createdAt, updatedAt, deletedAt

ClinicalEvolution: id, tenantId, medicalRecordId, hospitalizationId (FK opcional), profissionalId, tipoProfissional (enum: MEDICO, ENFERMEIRO, FISIOTERAPEUTA, OUTRO), descricao (text longo), cid10Id (FK para Cid10), dataHora, versao (Int — para versionamento), criadoPor, assinadoDigitalmente (Boolean), assinaturaHash, createdAt, updatedAt, deletedAt

ClinicalEvolutionHistory: id, evolutionId, versao, dadosSnapshot (Json), alteradoPor, createdAt (histórico imutável de versões)
```

### Prescrições
```
Prescription: id, tenantId, medicalRecordId, hospitalizationId (FK opcional), prescritoPor (userId), tipoPrescrito (enum: MEDICO, ENFERMEIRO), dataHora, status (enum: ATIVA, SUSPENSA, CONCLUIDA, CANCELADA), observacoes, assinadaDigitalmente (Boolean), assinaturaHash, createdAt, updatedAt, deletedAt

PrescriptionItem: id, prescriptionId, medicationId, dosagem, viaAdministracao (enum), frequencia (ex: "8/8h"), horariosProgramados (String[] — lista de horários ex: ["08:00","16:00","00:00"]), duracaoDias, dataInicio, dataFim, observacoes, status (enum: ATIVO, SUSPENSO, CONCLUIDO), createdAt, updatedAt, deletedAt
```

### Controle de Medicação (Enfermagem)
```
MedicationAdministration: id, tenantId, prescriptionItemId, hospitalizationId, administradoPor (userId), dataHoraProgamada, dataHoraAdministrada, status (enum: MINISTRADO, ATRASADO, NAO_MINISTRADO, RECUSADO_PACIENTE), observacoes, createdAt, updatedAt, deletedAt
```

### Solicitação de Exames
```
ExamRequest: id, tenantId, medicalRecordId, hospitalizationId (FK opcional), solicitadoPor (doctorId), patientId, examId, cid10Id (obrigatório para convênios), dataHoraSolicitacao, urgencia (enum: ROTINA, URGENTE, EMERGENCIA), status (enum: SOLICITADO, COLETADO, EM_ANALISE, CONCLUIDO, CANCELADO), resultado (text), dataHoraResultado, observacoes, codigoAutorizacaoConvenio, createdAt, updatedAt, deletedAt
```

### Internação
```
Hospitalization: id, tenantId, medicalRecordId, patientId, bedId, wardId, medicoResponsavelId, dataEntrada, dataPrevistaAlta, dataAlta, motivoInternacao, cid10AdmissaoId (obrigatório), cid10AltaId (preenchido na alta), tipoInternacao (enum: ELETIVA, URGENCIA, EMERGENCIA), tipoAcomodacao (enum: ENFERMARIA, APARTAMENTO, UTI), convenioId, numeroGuiaInternacao, sumarioAlta (text — preenchido na alta), condicaoPacienteAlta (enum: ALTA_MELHORADO, ALTA_CURADO, ALTA_PEDIDO, OBITO, TRANSFERENCIA), medicoAltaId, status (enum: ATIVA, ALTA, TRANSFERIDO, OBITO), createdAt, updatedAt, deletedAt
```

### Agendamento (NOVO — obrigatório)
```
Appointment: id, tenantId, patientId, doctorId, specialtyId, dataHora, duracao (em minutos), tipo (enum: CONSULTA, RETORNO, EXAME, PROCEDIMENTO), status (enum: AGENDADO, CONFIRMADO, EM_ATENDIMENTO, REALIZADO, CANCELADO, FALTOU), motivoCancelamento, convenioId, numeroGuiaConsulta, cid10Id (preenchido após consulta), observacoes, createdAt, updatedAt, deletedAt
```

### Faturamento / Convênios (NOVO — obrigatório)
```
BillingGuide: id, tenantId, patientId, convenioId, hospitalizationId (FK opcional), appointmentId (FK opcional), tipo (enum: INTERNACAO, CONSULTA, SADT), numeroGuia, dataEmissao, dataAutorizacao, codigoAutorizacao, valorTotal, status (enum: RASCUNHO, ENVIADA, AUTORIZADA, NEGADA, PAGA, GLOSADA), observacoes, createdAt, updatedAt, deletedAt

BillingItem: id, billingGuideId, examId (FK opcional), medicationId (FK opcional), procedimentoDescricao, codigoTUSS, quantidade, valorUnitario, valorTotal, status (enum: AUTORIZADO, GLOSADO), motivoGlosa, createdAt, updatedAt, deletedAt
```

## ✅ ENTREGÁVEIS DESTA FASE

1. `schema.prisma` completo com todos os modelos acima
2. Todas as migrations iniciais
3. Seed com:
   - Tabela CID-10 (importar do arquivo oficial DATASUS)
   - Tenant de demonstração
   - Usuário admin (com `mustChangePassword: true`)
   - Roles padrão (ADMIN, MEDICO, ENFERMEIRO, RECEPCIONISTA, FATURAMENTO)
   - Especialidades médicas e CBO
4. Índices de performance documentados

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 3 — MÓDULOS DE USUÁRIOS, ACESSO E ESTRUTURA HOSPITALAR
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com a Fase 1 (infraestrutura) e Fase 2 (schema) concluídas, implemente os módulos de gestão de usuários, profissionais de saúde e estrutura hospitalar.

## 👥 MÓDULO: USUÁRIOS (`users`)

### Dados obrigatórios do usuário
- Nome completo, CPF (armazenado criptografado via `EncryptionService`), data de nascimento, sexo, email, telefone, endereço completo, roleId, status (ativo/inativo), data de admissão, `mustChangePassword`

### Endpoints
- `POST /users` — criar usuário (admin)
- `GET /users` — listar com paginação, filtros e busca por nome/CPF/email
- `GET /users/:id` — detalhar
- `PATCH /users/:id` — editar
- `DELETE /users/:id` — soft delete
- `POST /users/:id/reset-password` — resetar senha (admin)
- `PATCH /users/me/change-password` — trocar própria senha

## 👨‍⚕️ MÓDULO: MÉDICOS (`doctors`)

### Dados completos
- Nome completo, CPF (criptografado), CRM, UF do CRM, data de expedição do CRM, especialidades (N:N com Specialty), CNS (criptografado), registro profissional secundário, assinatura digital (campo para path do arquivo), telefone profissional, email profissional, status, vínculo com a empresa (tenantId)

### Regra de negócio
- CRM deve ser único por UF dentro do mesmo tenant
- Médico pode ter vínculo com login do sistema (userId opcional)

### Endpoints CRUD completos com paginação e filtros por especialidade/status

## 👩‍⚕️ MÓDULO: ENFERMEIROS (`nurses`)

### Dados completos
- Nome completo, CPF (criptografado), COREN, UF do COREN, data de expedição, categoria (enum: ENFERMEIRO, TECNICO, AUXILIAR), CNS (criptografado), `podePrescrever` (Boolean), status

### Regra de negócio
- `podePrescrever` só pode ser ativado por usuário com perfil ADMIN
- COREN único por UF dentro do tenant

### Endpoints CRUD completos

## 🧑‍💼 MÓDULO: CARGOS/ROLES (`roles`)

### Estrutura de permissões granular (RBAC)
Cada role deve ter um objeto JSON de permissões com as seguintes flags booleanas:
```json
{
  "pacientes": { "criar": true, "editar": true, "visualizar": true, "excluir": false },
  "prontuario": { "visualizar": true, "editar": false },
  "prescricao": { "criar": false, "visualizar": true },
  "exames": { "solicitar": false, "liberar": false, "visualizar": true },
  "internacao": { "admitir": false, "alta": false, "visualizar": true },
  "medicacao": { "administrar": true, "visualizar": true },
  "agendamento": { "criar": true, "cancelar": true, "visualizar": true },
  "faturamento": { "criar": false, "visualizar": false },
  "relatorios": { "visualizar": false },
  "sistema": { "administrar": false }
}
```

### Endpoints CRUD com validação de permissões

## 🏥 MÓDULO: ESTRUTURA HOSPITALAR (`wards` e `beds`)

### Alas (`wards`)
- Nome, tipo (UTI, ENFERMARIA, EMERGENCIA, AMBULATORIO, CIRURGICO, PEDIATRIA, MATERNIDADE), capacidade, andar, status

### Leitos (`beds`)
- Número, tipo (UTI, CLÍNICO, ISOLAMENTO, PEDIÁTRICO, CIRÚRGICO), status (LIVRE, OCUPADO, MANUTENÇÃO, RESERVADO), vínculo com ala

### Endpoints
- CRUD de alas e leitos
- `GET /wards/:id/beds` — listar leitos de uma ala
- `GET /beds/available` — listar leitos livres com filtro por tipo e ala
- `GET /wards/occupancy` — taxa de ocupação por ala (para dashboard)

## ✅ ENTREGÁVEIS DESTA FASE

1. Módulos `users`, `roles`, `doctors`, `nurses`, `wards`, `beds` completamente implementados
2. DTOs com validação (class-validator) e decorators Swagger em todos os campos
3. Testes unitários dos use cases principais
4. Guards de RBAC aplicados em todos os endpoints

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 4 — CADASTRO DE PACIENTES E AGENDAMENTO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com os módulos de profissionais criados, implemente o cadastro completo de pacientes e o módulo de agendamento de consultas.

## 🧑‍🦽 MÓDULO: PACIENTES (`patients`)

### Dados completos
- Nome completor tenant (validar formato e dígitos verificadores)
- CNS deve ser validado pelo algoritmo oficial do DATASUS
- Ao cadastrar, criar automaticamente um `MedicalRecord` vinculado ao paciente

### Endpoints
- `POST /patients` — cadastrar (cria MedicalRecord automaticamente)
- `GET /patients` — listar com paginação e filtros (nome, CPF, convênio, status)
- `GET /patients/:id` — detalhar com dados do prontuário ativo
- `PATCH /patients/:id` — editar
- `DELETE /patients/:id` — soft delete (apenas se não houver internação ativa)
- `GET /patients/:id/medical-record` — prontuário ativo do paciente
- `GET /patients/:id/hospitalizations` — histórico de internações

## 📅 MÓDULO: AGENDAMENTO (`appointments`) — OBRIGATÓRIO

Este módulo é obrigatório para o funcionamento em clínicas (o maior volume de atendimento é ambulatorial, não internação).

### Funcionalidades
- Agendar consulta vinculando paciente + médico + especialidade + data/hora + tipo
- Verificar disponibilidade do médico no horário solicitado (sem conflito de agenda)
- Confirmar, cancelar e registrar falta
- Após atendimento: preencher CID-10 da consulta e finalizar
- Gerar guia de faturamento automaticamente ao confirmar consulta de convênio

### Endpoints
- `POST /appointments` — agendar
- `GET /appointments` — listar com filtros (médico, data, status, paciente)
- `GET /appointments/doctor/:doctorId/availability` — verificar disponibilidade de um médico em uma data
- `PATCH /appointments/:id/confirm` — confirmar
- `PATCH /appointments/:id/cancel` — cancelar com motivo
- `PATCH /appointments/:id/start` — iniciar atendimento
- `PATCH /appointments/:id/finish` — finalizar com CID-10
- `GET /appointments/today` — agenda do dia (para dashboard)

### Notificações via BullMQ
- Ao agendar: enfileirar job para envio de e-mail/SMS de confirmação ao paciente (24h antes)
- Ao cancelar: enfileirar job para notificação ao paciente

## ✅ ENTREGÁVEIS DESTA FASE

1. Módulo `patients` completo com validação de CPF e CNS
2. Módulo `appointments` completo com verificação de disponibilidade
3. Workers BullMQ para notificações de agendamento
4. DTOs com validação e Swagger
5. Testes unitários das regras de negócio (validação CPF, conflito de horário)o, CPF (criptografado — unique por tenant), CNS (criptografado), data de nascimento, sexo, nome da mãe, nome do pai, endereço completo (Json: logradouro, número, complemento, bairro, cidade, UF, CEP), telefone, contato de emergência (Json: nome, telefone, parentesco), convenioId, número da carteirinha, data de validade da carteirinha, alergias (array), comorbidades (array), histórico clínico, grupo sanguíneo, status

### Regras de negócio
- CPF único p

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 5 — PRONTUÁRIO ELETRÔNICO, PRESCRIÇÕES E INTERNAÇÃO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Esta é a fase central do PEP+. Implemente o prontuário eletrônico, prescrições médicas e o fluxo completo de internação hospitalar.

## 📋 MÓDULO: PRONTUÁRIO ELETRÔNICO (`medical-records`)

### Evolução Clínica
- Registro com: data/hora, profissional responsável, tipo do profissional, descrição detalhada, CID-10 (obrigatório para médicos), vínculo com internação (opcional)
- **Versionamento obrigatório:** toda edição cria uma nova versão em `ClinicalEvolutionHistory` — nunca sobrescreve o registro original
- **Assinatura digital:** campo para hash de assinatura (preparado para integração futura com ICP-Brasil conforme Resolução CFM 2299/2021)
- Log de auditoria: registrar quem acessou o prontuário, quando e qual ação realizou

### Regras de negócio
- Apenas MÉDICOS e ENFERMEIROS (com permissão) podem criar evoluções
- Todo acesso ao prontuário deve ser registrado no `AuditLog` (LGPD — Resolução CFM 1821/2007)
- Prontuário fechado não pode ser editado (apenas anotações com justificativa)

### Endpoints
- `GET /medical-records/:id` — prontuário completo com histórico de evoluções
- `POST /medical-records/:id/evolutions` — registrar evolução
- `GET /medical-records/:id/evolutions` — listar evoluções com paginação
- `GET /medical-records/:id/evolutions/:evolutionId/history` — histórico de versões de uma evolução

## 💊 MÓDULO: PRESCRIÇÕES (`prescriptions`)

### Estrutura da prescrição
- Cabeçalho: prescritor, data/hora, status, observações, assinatura digital (hash)
- Itens: medicamento, dosagem, via de administração, frequência, horários programados (lista de horários ex: ["08:00","16:00","00:00"]), duração em dias, data início/fim

### Regras de negócio obrigatórias
- **Apenas MÉDICOS podem prescrever** — verificado via RBAC e regra de domínio
- **ENFERMEIROS** só podem prescrever se tiverem `podePrescrever = true`
- Ao criar prescrição, gerar automaticamente os registros de `MedicationAdministration` para cada item (um por horário programado por dia)
- Suspender prescrição não exclui os registros futuros de administração — marca como `NAO_MINISTRADO` com observação

### Endpoints
- `POST /medical-records/:id/prescriptions` — criar prescrição
- `GET /medical-records/:id/prescriptions` — listar prescrições ativas e históricas
- `PATCH /prescriptions/:id/suspend` — suspender prescrição com motivo
- `POST /prescriptions/:id/items` — adicionar item à prescrição
- `DELETE /prescriptions/:id/items/:itemId` — remover item

## 🕒 MÓDULO: CONTROLE DE MEDICAÇÃO

### Administração de medicamentos (enfermagem)
- Registrar administração: quem administrou, data/hora real, status (MINISTRADO, ATRASADO, NAO_MINISTRADO, RECUSADO_PACIENTE), observações
- Histórico completo imutável

### Notificações via BullMQ
- Job agendado: verificar a cada 15 minutos se há medicações com status pendente cujo horário programado já passou → atualizar para ATRASADO e notificar o responsável pelo turno

### Endpoints
- `GET /medication-administrations/pending` — medicações pendentes do turno atual (filtradas por ala/leito)
- `PATCH /medication-administrations/:id/administer` — registrar administração
- `GET /medication-administrations/history` — histórico com filtros

## 🧪 MÓDULO: EXAMES (`exams` e `exam-requests`)

### Funcionalidades
- Cadastro do catálogo de exames com código TUSS (obrigatório para convênios)
- Solicitação de exame pelo médico vinculando: paciente, exame, CID-10 (obrigatório para convênios), urgência, internação (opcional)
- Registro de resultado com data/hora
- Geração de autorização para convênio (código de autorização)

### Endpoints
- CRUD do catálogo de exames
- `POST /exam-requests` — solicitar exame
- `PATCH /exam-requests/:id/result` — registrar resultado
- `GET /exam-requests` — listar com filtros (paciente, status, urgência)

## 🛏️ MÓDULO: INTERNAÇÃO (`hospitalizations`)

### Fluxo completo de internação

**Admissão:**
- Vincular: paciente + leito + ala + médico responsável + CID-10 de admissão (obrigatório) + tipo de internação + acomodação + convênio
- Ao admitir: mudar status do leito para OCUPADO
- Gerar guia de internação para convênio automaticamente (se aplicável)

**Durante a internação:**
- Evoluções clínicas vinculadas à internação
- Prescrições vinculadas à internação
- Solicitações de exames vinculadas
- Controle de medicação vinculado

**Alta hospitalar (campos obrigatórios):**
- CID-10 da alta (pode diferir do de admissão)
- Sumário de alta (texto descritivo obrigatório)
- Condição do paciente na alta (MELHORADO, CURADO, A PEDIDO, ÓBITO, TRANSFERÊNCIA)
- Médico responsável pela alta
- Data e hora da alta
- Ao dar alta: mudar status do leito para LIVRE, fechar prontuário

### Endpoints
- `POST /hospitalizations` — admitir paciente
- `GET /hospitalizations/active` — internações ativas com filtros
- `PATCH /hospitalizations/:id/discharge` — dar alta (campos obrigatórios validados)
- `GET /hospitalizations/:id` — detalhes com evoluções, prescrições e exames

## ✅ ENTREGÁVEIS DESTA FASE

1. Módulo `medical-records` com versionamento de evoluções e auditoria de acesso
2. Módulo `prescriptions` com geração automática de `MedicationAdministration`
3. Worker BullMQ para alertas de medicação atrasada
4. Módulo `exam-requests` com código TUSS
5. Módulo `hospitalizations` com fluxo completo de admissão e alta
6. Todos os DTOs com validação e Swagger
7. Testes unitários dos fluxos de prescrição e alta hospitalar

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 6 — FATURAMENTO, RELATÓRIOS E SEGURANÇA AVANÇADA
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 💰 MÓDULO: FATURAMENTO (`billing`) — OBRIGATÓRIO

Sem faturamento o sistema não é utilizável comercialmente. Implementar estrutura básica de guias para convênios.

### Funcionalidades
- Geração de guias de internação e consulta vinculadas a convênio
- Itens da guia com código TUSS (exames, procedimentos, medicamentos de alto custo)
- Controle de status da guia (RASCUNHO → ENVIADA → AUTORIZADA/NEGADA → PAGA/GLOSADA)
- Registro de glosas com motivo por item
- Relatório de faturamento por convênio e período

### Estrutura TISS básica
- O sistema deve ter campos alinhados ao padrão TISS (Troca de Informações em Saúde Suplementar) da ANS para compatibilidade futura com envio eletrônico
- Campos obrigatórios: código TUSS, código de autorização, número da guia, data de autorização

### Endpoints
- `POST /billing/guides` — gerar guia manualmente
- `GET /billing/guides` — listar guias com filtros
- `PATCH /billing/guides/:id/submit` — marcar como enviada
- `PATCH /billing/guides/:id/authorize` — registrar autorização
- `PATCH /billing/guides/:id/items/:itemId/gloss` — registrar glosa em item
- `GET /billing/reports/by-insurance` — faturamento por convênio

## 📊 MÓDULO: RELATÓRIOS (`reports`)

Todos os relatórios devem ser gerados de forma assíncrona via BullMQ (relatórios grandes não podem travar a API).

### Relatórios obrigatórios
1. **Pacientes internados** — lista atual com leito, ala, médico, dias de internação
2. **Taxa de ocupação de leitos** — por ala, por tipo, geral (em tempo real do Redis)
3. **Pacientes por ala** — distribuição atual
4. **Histórico de medicamentos** — por paciente e período
5. **Administração de medicamentos por horário** — conformidade (% ministrado x atrasado x não ministrado)
6. **Exames realizados** — por tipo, por médico, por período
7. **Tempo médio de internação** — por especialidade e por ala
8. **Agenda do dia** — consultas e procedimentos agendados
9. **Faturamento por convênio** — por período

### Implementação
- Endpoint `POST /reports/generate` com payload indicando tipo e filtros
- Job BullMQ processa e armazena resultado no Redis com TTL de 1 hora
- Endpoint `GET /reports/:jobId/status` para verificar andamento
- Endpoint `GET /reports/:jobId/result` para baixar resultado (JSON ou CSV)

## 🔒 SEGURANÇA AVANÇADA E LGPD

### Criptografia de dados em repouso
- Confirmar que `EncryptionService` (criado na Fase 1) está aplicado em todos os campos sensíveis: CPF, CNS, diagnósticos em `ClinicalEvolution`
- Campos criptografados devem ser buscáveis via hash determinístico separado (campo `cpfHash` para queries de busca por CPF)

### Política de retenção de dados (LGPD + CFM)
- Implementar `RetentionService` que:
  - Prontuários: nunca podem ser excluídos permanentemente (Resolução CFM 1821/2007 exige 20 anos)
  - Soft delete preserva o registro — o `deletedAt` apenas oculta da interface
  - Exportação de dados do paciente (direito do titular — LGPD Art. 18)
- Endpoint `GET /patients/:id/data-export` — exportar todos os dados de um paciente em JSON (para atender pedido do titular)
- Endpoint `POST /patients/:id/anonymize` — anonimizar dados não-essenciais após prazo legal

### Logs de acesso ao prontuário (LGPD + CFM)
- Todo acesso ao prontuário (leitura ou escrita) deve ser registrado no `AuditLog` com: userId, patientId, ação, ip, userAgent, timestamp
- Endpoint `GET /audit/medical-record/:patientId` — histórico de quem acessou o prontuário de um paciente (apenas ADMIN e o próprio paciente via portal futuro)

### Backup (documentação obrigatória)
- Criar `BACKUP.md` documentando a estratégia de backup para produção:
  - Backup diário do PostgreSQL (pg_dump) com retenção de 30 dias
  - Backup semanal com retenção de 1 ano
  - Backup mensal com retenção de 20 anos (conformidade CFM)
  - Instruções de restore testadas

## ✅ ENTREGÁVEIS DESTA FASE

1. Módulo `billing` com estrutura TISS básica
2. Módulo `reports` com geração assíncrona via BullMQ
3. `RetentionService` e `EncryptionService` revisados e aplicados
4. Endpoint de exportação de dados do paciente (LGPD)
5. Auditoria de acesso ao prontuário completa
6. `BACKUP.md` com estratégia de retenção por 20 anos

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FASE 7 — FRONTEND REACT COMPLETO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Com o backend das Fases 1-6 concluído e documentado no Swagger, crie o **frontend completo em React** integrado à API do PEP+.

## 💻 TECNOLOGIAS DO FRONTEND

- **React.js** com TypeScript
- **Gerenciamento de estado:** Zustand (leve e adequado para SaaS)
- **Biblioteca de componentes:** Ant Design (antd) — padrão em sistemas hospitalares e de gestão
- **Roteamento:** React Router v6
- **HTTP Client:** Axios com interceptors para JWT automático e refresh token
- **Formulários:** React Hook Form + Zod para validação
- **Tabelas:** Ant Design Table com paginação server-side
- **Gráficos (relatórios):** Recharts
- **Datas:** Day.js
- **Build:** Vite

## 🎨 PADRÃO VISUAL

- Interface profissional no padrão de sistema hospitalar corporativo (sóbrio, denso em informação, funcional)
- Paleta: branco e cinza claro como base, azul corporativo como cor primária, vermelho para alertas críticos (medicação atrasada, leito em manutenção)
- Sidebar fixa com navegação por módulo
- Header com: tenant ativo, usuário logado, notificações

## 🖥️ TELAS OBRIGATÓRIAS

### 1. Login
- Campo de subdomínio do tenant (ou detecção automática via URL)
- Email e senha
- Tratamento de erro claro
- Redirecionamento para troca de senha obrigatória se `mustChangePassword = true`

### 2. Dashboard
- Taxa de ocupação de leitos (gráfico pizza por tipo)
- Internações ativas (contador)
- Agenda do dia (lista de consultas)
- Medicações atrasadas (alerta vermelho com contador)
- Exames com resultado pendente

### 3. Pacientes
- Listagem com busca por nome, CPF, convênio
- Formulário de cadastro completo com todos os campos (incluindo alergias e comorbidades como tags)
- Visualização do prontuário ativo

### 4. Médicos e Enfermeiros
- Listagem com filtros por especialidade/status/categoria
- Formulário de cadastro com validação de CRM/COREN por UF

### 5. Estrutura Hospitalar (Alas e Leitos)
- Mapa visual dos leitos por ala (grid com status por cor: verde=livre, vermelho=ocupado, amarelo=manutenção)
- Formulário de ala e leito

### 6. Agendamento
- Calendário semanal da agenda médica
- Formulário de agendamento com verificação de disponibilidade em tempo real
- Lista de consultas do dia com ações rápidas (confirmar, iniciar, cancelar)

### 7. Internação
- Formulário de admissão com busca de paciente, seleção de leito livre, CID-10
- Lista de internações ativas com filtros por ala
- Tela de alta hospitalar com campos obrigatórios

### 8. Prontuário Eletrônico (PEP) — tela principal
- Timeline de evoluções clínicas com data/hora e profissional
- Editor de nova evolução com campo CID-10
- Aba de prescrições ativas
- Aba de exames solicitados/resultados
- Histórico de versões de uma evolução

### 9. Prescrição Médica
- Formulário de nova prescrição com adição de múltiplos itens
- Seleção de medicamento com autocomplete
- Campos de dosagem, via, frequência e horários programados
- Lista de prescrições ativas por paciente

### 10. Administração de Medicamentos (Enfermagem)
- Lista de medicações pendentes do turno filtrada por ala/leito
- Botão de registrar administração com confirmação
- Indicação visual de medicações atrasadas (vermelho)
- Histórico de administrações do dia

### 11. Relatórios
- Seleção de tipo de relatório e filtros
- Indicador de progresso de geração (polling do status do job)
- Exibição do resultado (tabela ou gráfico conforme o tipo)
- Opção de exportar para CSV

### 12. Faturamento
- Lista de guias por convênio e status
- Formulário de geração de guia
- Tela de detalhamento da guia com itens e glosas

## 🔐 CONTROLE DE ACESSO NO FRONTEND

- Rotas protegidas por autenticação (redirecionar para login se não autenticado)
- Menus e botões ocultados conforme as permissões do RBAC do usuário logado
- Hook `usePermission('prescricao.criar')` reutilizável para verificar permissão em qualquer componente
- Armazenar token e permissões no Zustand (não no localStorage — usar cookie httpOnly para refresh token)

## ✅ ENTREGÁVEIS DESTA FASE

1. Projeto React com Vite, TypeScript e todas as dependências configuradas
2. Todas as 12 telas implementadas e integradas com a API
3. Interceptor Axios com refresh token automático
4. Hook `usePermission` para RBAC no frontend
5. Componentes reutilizáveis: tabela paginada, formulário de paciente, seletor CID-10
6. `README.md` com instruções de instalação e execução

---

# 📌 REFERÊNCIA RÁPIDA — ORDEM DE EXECUÇÃO

| Fase | Conteúdo | Dependências |
|------|----------|--------------|
| **Fase 1** | Infraestrutura, Docker, Redis, BullMQ, Guards | Nenhuma |
| **Fase 2** | Schema Prisma completo + Migrations + Seeds | Fase 1 |
| **Fase 3** | Usuários, Médicos, Enfermeiros, Alas, Leitos | Fases 1 e 2 |
| **Fase 4** | Pacientes + Agendamento | Fases 1, 2 e 3 |
| **Fase 5** | Prontuário, Prescrições, Internação | Fases 1, 2, 3 e 4 |
| **Fase 6** | Faturamento, Relatórios, LGPD | Fases 1 a 5 |
| **Fase 7** | Frontend React completo | Fases 1 a 6 |

> ⚠️ **Importante:** Envie um prompt por vez. Aguarde o Gemini Pro entregar o código de cada fase antes de enviar o próximo. Se a resposta for interrompida, peça para continuar de onde parou antes de avançar.
