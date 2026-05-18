# PLANO DE IMPLEMENTAÇÃO ENTERPRISE — MÓDULO FINANCEIRO PEP+
## Roadmap Técnico Completo — 10 Fases de Produção
### Coordenação: Arquiteto Enterprise + Tech Lead

---

> **Instrução de uso:** Envie ao Gemini Pro um PROMPT por vez. Aguarde conclusão completa, valide o checklist da fase, antes de enviar o próximo. Nunca pule fases.

---

# ════════════════════════════════════════════════════════════
# FASE 1 — FUNDAÇÃO FINANCEIRA: PLANO DE CONTAS, CENTROS DE CUSTO E LANÇAMENTOS
# ════════════════════════════════════════════════════════════

## Objetivo da Fase

Construir a fundação de dados financeiros do PEP+: o **Plano de Contas** (estrutura hierárquica contábil), os **Centros de Custo** (alocação de receitas e despesas por setor hospitalar) e o modelo de **Lançamento Financeiro** (`FinancialTransaction`) com seu CRUD completo, paginação, filtros e validações enterprise. Esta fase cria a infraestrutura de dados sobre a qual todo o módulo financeiro avançado será construído.

## Motivo Arquitetural

Sem plano de contas e centros de custo, nenhum lançamento financeiro pode ser categorizado. Sem `FinancialTransaction` estruturado, as fases subsequentes (lançamentos automáticos de guias TISS, honorários médicos, DRE e fluxo de caixa) não têm onde persistir os dados. Esta fase não depende de nenhum módulo financeiro futuro, apenas dos módulos de infraestrutura já existentes.

## Dependências Obrigatórias

**Módulos existentes utilizados (NÃO alterar):**
- `src/shared/infrastructure/database/prisma.module.ts` — `PrismaModule` global
- `src/shared/guards/jwt-auth.guard.ts` — `JwtAuthGuard`
- `src/shared/guards/permissions.guard.ts` — `PermissionsGuard`
- `src/shared/decorators/permissions.decorator.ts` — `@RequirePermissions`
- `src/shared/interceptors/transform.interceptor.ts` — `@TransformResponse()`
- `src/shared/dto/pagination.dto.ts` — `PaginationDto` (base dos Query DTOs)
- `src/shared/infrastructure/utils/prisma-pagination.util.ts` — `buildPaginationQuery` e `buildPaginatedResult`
- `src/common/middlewares/tenant.middleware.ts` — `TenantRequest`
- `src/app.module.ts` — registrar o novo módulo ao final

**Models Prisma existentes referenciados:**
- `User` (criadoPorId, aprovadoPorId nos lançamentos)
- `Tenant` (tenantId em todos os models)

**Migrations necessárias:** 2 novas migrations sequenciais (detalhadas abaixo).

## Arquivos que serão CRIADOS

### Prisma Schema (1 bloco de adição)
```
prisma/schema.prisma                              ← MODIFICAR (adicionar 3 models + 4 enums)
prisma/migrations/YYYYMMDD_add_cost_centers/      ← CRIAR migration
prisma/migrations/YYYYMMDD_add_financial_tx/      ← CRIAR migration
```

### Backend — Domínio (Domain Layer)
```
src/shared/domain/entities/cost-center.entity.ts
src/shared/domain/entities/chart-of-accounts.entity.ts
src/shared/domain/entities/financial-transaction.entity.ts
src/shared/domain/repositories/cost-center.repository.interface.ts
src/shared/domain/repositories/chart-of-accounts.repository.interface.ts
src/shared/domain/repositories/financial-transaction.repository.interface.ts
```

### Backend — Infrastructure (Prisma Repositories)
```
src/shared/infrastructure/database/prisma/repositories/prisma-cost-center.repository.ts
src/shared/infrastructure/database/prisma/repositories/prisma-chart-of-accounts.repository.ts
src/shared/infrastructure/database/prisma/repositories/prisma-financial-transaction.repository.ts
```

### Backend — Application (Use Cases)
```
src/shared/application/use-cases/financial/cost-center.use-cases.ts
src/shared/application/use-cases/financial/chart-of-accounts.use-cases.ts
src/shared/application/use-cases/financial/financial-transaction.use-cases.ts
```

### Backend — Presentation (Module, Controller, DTOs)
```
src/modules/financial/financial.module.ts
src/modules/financial/financial.controller.ts
src/modules/financial/dto/cost-center.dto.ts
src/modules/financial/dto/chart-of-accounts.dto.ts
src/modules/financial/dto/financial-transaction.dto.ts
src/modules/financial/dto/query-financial.dto.ts
```

### Backend — Seed
```
prisma/seeds/financial-seed.ts                    ← CRIAR seed isolado
```

### Frontend
```
frontend/src/modules/financial/services/financial.service.ts
frontend/src/modules/financial/pages/CostCentersList/index.tsx
frontend/src/modules/financial/pages/ChartOfAccountsTree/index.tsx
frontend/src/modules/financial/pages/FinancialTransactionsList/index.tsx
frontend/src/modules/financial/pages/FinancialTransactionForm/index.tsx
frontend/src/modules/financial/components/TransactionFormModal/index.tsx
```

## Arquivos que serão MODIFICADOS

```
prisma/schema.prisma                              ← Adicionar 3 models + 4 enums (não alterar os existentes)
prisma/seed.ts                                    ← Adicionar chamada ao financial-seed.ts
src/app.module.ts                                 ← Importar e registrar FinancialModule
frontend/src/routes/index.tsx                     ← Adicionar 4 novas rotas financeiras
frontend/src/shared/components/Sidebar/index.tsx  ← Adicionar grupo "Financeiro" no menu
```

## Models Prisma Envolvidos

### Adicionar ao `prisma/schema.prisma`:

```prisma
// ==========================================
// CENTRO DE CUSTO
// ==========================================
model CostCenter {
  id       String @id @default(uuid())
  tenantId String

  codigo      String
  nome        String
  tipo        CostCenterType
  codigoPai   String?
  ativo       Boolean   @default(true)
  descricao   String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  tenant       Tenant                 @relation(fields: [tenantId], references: [id])
  transactions FinancialTransaction[]

  @@unique([tenantId, codigo])
  @@index([tenantId, deletedAt])
  @@index([tenantId, tipo, deletedAt])
}

// ==========================================
// PLANO DE CONTAS
// ==========================================
model ChartOfAccounts {
  id       String @id @default(uuid())
  tenantId String

  codigo            String
  nome              String
  tipo              AccountingType
  natureza          AccountNature
  codigoPai         String?
  aceitaLancamento  Boolean  @default(true)
  ativo             Boolean  @default(true)
  descricao         String?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  tenant       Tenant                 @relation(fields: [tenantId], references: [id])
  transactions FinancialTransaction[]

  @@unique([tenantId, codigo])
  @@index([tenantId, tipo, deletedAt])
  @@index([tenantId, deletedAt])
}

// ==========================================
// LANÇAMENTO FINANCEIRO
// ==========================================
model FinancialTransaction {
  id       String @id @default(uuid())
  tenantId String

  tipo            TransactionType
  natureza        TransactionNature
  chartAccountId  String
  costCenterId    String?

  descricao       String
  valor           Float
  dataCompetencia DateTime
  dataVencimento  DateTime?
  dataPagamento   DateTime?
  status          TransactionStatus @default(PENDENTE)

  origemTipo      String?
  origemId        String?

  numeroDocumento String?
  formaPagamento  PaymentMethod?
  observacoes     String?

  criadoPorId   String
  aprovadoPorId String?
  aprovadoEm    DateTime?

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  tenant       Tenant          @relation(fields: [tenantId], references: [id])
  chartAccount ChartOfAccounts @relation(fields: [chartAccountId], references: [id])
  costCenter   CostCenter?     @relation(fields: [costCenterId], references: [id])
  criadoPor    User            @relation("TransactionCreator", fields: [criadoPorId], references: [id])
  aprovadoPor  User?           @relation("TransactionApprover", fields: [aprovadoPorId], references: [id])

  @@index([tenantId, tipo, status, deletedAt])
  @@index([tenantId, dataCompetencia, deletedAt])
  @@index([tenantId, chartAccountId, deletedAt])
  @@index([tenantId, costCenterId, deletedAt])
  @@index([tenantId, origemTipo, origemId])
}

// ==========================================
// ENUMS FINANCEIROS (adicionar junto dos outros enums)
// ==========================================
enum CostCenterType    { CLINICO ADMINISTRATIVO APOIO }
enum AccountingType    { RECEITA DESPESA ATIVO PASSIVO }
enum AccountNature     { DEVEDORA CREDORA }
enum TransactionType   { RECEITA DESPESA }
enum TransactionNature { CONVENIO PARTICULAR SUS CUSTO_OPERACIONAL SALARIO OUTROS }
enum TransactionStatus { PENDENTE APROVADO PAGO CANCELADO }
enum PaymentMethod     { DINHEIRO CARTAO_CREDITO CARTAO_DEBITO PIX TED DOC CHEQUE CONVENIO SUS }
```

## Fluxo Técnico Completo

### Backend

**1. Migration 1 — CostCenter e ChartOfAccounts:**
```bash
npx prisma migrate dev --name add_cost_centers_and_chart_of_accounts
```

**2. Migration 2 — FinancialTransaction:**
```bash
npx prisma migrate dev --name add_financial_transactions
```

**3. Seed financeiro padrão (`prisma/seeds/financial-seed.ts`):**

O seed deve criar os dados padrão para qualquer novo tenant:

```typescript
// Plano de Contas padrão hospitalar (importado no seed.ts principal)
const defaultChartOfAccounts = [
  // RECEITAS
  { codigo: '3',     nome: 'RECEITAS',                  tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: false },
  { codigo: '3.1',   nome: 'Receitas Operacionais',      tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: false, codigoPai: '3' },
  { codigo: '3.1.1', nome: 'Receitas de Convênios',      tipo: 'RECEITA', natureza: 'CREDORA', codigoPai: '3.1' },
  { codigo: '3.1.2', nome: 'Receitas Particulares',      tipo: 'RECEITA', natureza: 'CREDORA', codigoPai: '3.1' },
  { codigo: '3.1.3', nome: 'Receitas SUS',               tipo: 'RECEITA', natureza: 'CREDORA', codigoPai: '3.1' },
  { codigo: '3.1.4', nome: 'Receitas de Exames',         tipo: 'RECEITA', natureza: 'CREDORA', codigoPai: '3.1' },
  { codigo: '3.1.5', nome: 'Receitas de Medicamentos',   tipo: 'RECEITA', natureza: 'CREDORA', codigoPai: '3.1' },
  // DESPESAS
  { codigo: '4',     nome: 'DESPESAS',                   tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false },
  { codigo: '4.1',   nome: 'Despesas com Pessoal',       tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false, codigoPai: '4' },
  { codigo: '4.1.1', nome: 'Salários e Ordenados',       tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.1' },
  { codigo: '4.1.2', nome: 'Honorários Médicos',         tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.1' },
  { codigo: '4.2',   nome: 'Despesas Operacionais',      tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false, codigoPai: '4' },
  { codigo: '4.2.1', nome: 'Materiais e Medicamentos',   tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.2' },
  { codigo: '4.2.2', nome: 'Serviços de Terceiros',      tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.2' },
  { codigo: '4.2.3', nome: 'Manutenção de Equipamentos', tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.2' },
  { codigo: '4.3',   nome: 'Despesas Administrativas',   tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false, codigoPai: '4' },
  { codigo: '4.3.1', nome: 'Materiais de Escritório',    tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.3' },
  { codigo: '4.3.2', nome: 'Utilidades (Energia/Água)',  tipo: 'DESPESA', natureza: 'DEVEDORA', codigoPai: '4.3' },
];

// Centros de Custo padrão
const defaultCostCenters = [
  { codigo: '100', nome: 'UTI Adulto',         tipo: 'CLINICO' },
  { codigo: '101', nome: 'Enfermaria',          tipo: 'CLINICO' },
  { codigo: '102', nome: 'Centro Cirúrgico',    tipo: 'CLINICO' },
  { codigo: '103', nome: 'Pronto-Socorro',      tipo: 'CLINICO' },
  { codigo: '104', nome: 'Ambulatório',         tipo: 'CLINICO' },
  { codigo: '200', nome: 'Laboratório',         tipo: 'APOIO' },
  { codigo: '201', nome: 'Radiologia',          tipo: 'APOIO' },
  { codigo: '202', nome: 'Farmácia',            tipo: 'APOIO' },
  { codigo: '300', nome: 'Administração',       tipo: 'ADMINISTRATIVO' },
  { codigo: '301', nome: 'Faturamento',         tipo: 'ADMINISTRATIVO' },
  { codigo: '302', nome: 'Recursos Humanos',    tipo: 'ADMINISTRATIVO' },
];
```

**4. Fluxo de endpoints do Controller:**

```
# Centros de Custo
GET    /financial/cost-centers              → listar (paginado + filtros: tipo, ativo, search)
POST   /financial/cost-centers              → criar
GET    /financial/cost-centers/:id          → detalhar
PATCH  /financial/cost-centers/:id          → editar
DELETE /financial/cost-centers/:id          → soft delete

# Plano de Contas
GET    /financial/chart-of-accounts         → listar em formato hierárquico (árvore)
GET    /financial/chart-of-accounts/flat    → listar flat para select/autocomplete
POST   /financial/chart-of-accounts         → criar conta
GET    /financial/chart-of-accounts/:id     → detalhar
PATCH  /financial/chart-of-accounts/:id     → editar

# Lançamentos Financeiros
GET    /financial/transactions              → listar paginado (filtros: tipo, status, natureza, chartAccountId, costCenterId, dataCompetencia, dataVencimento)
POST   /financial/transactions              → criar lançamento manual
GET    /financial/transactions/:id          → detalhar
PATCH  /financial/transactions/:id          → editar (apenas PENDENTE)
DELETE /financial/transactions/:id          → soft delete (apenas PENDENTE)
PATCH  /financial/transactions/:id/approve  → aprovar lançamento (muda para APROVADO)
PATCH  /financial/transactions/:id/pay      → registrar pagamento (muda para PAGO, salva dataPagamento e formaPagamento)
PATCH  /financial/transactions/:id/cancel   → cancelar (muda para CANCELADO)
```

**5. Regras de negócio obrigatórias nos Use Cases:**

- `CostCenter`: código único por tenant — validar antes de criar
- `ChartOfAccounts`: código único por tenant — validar; conta com `aceitaLancamento: false` não pode receber lançamentos diretos
- `FinancialTransaction`:
  - Só pode ser editada quando `status === PENDENTE`
  - Só pode ser deletada quando `status === PENDENTE`
  - `aprovadoPorId` não pode ser o mesmo que `criadoPorId` (4-eyes principle)
  - Ao aprovar: verificar se o aprovador tem permissão `faturamento.editar`
  - Ao pagar: `dataPagamento` e `formaPagamento` são obrigatórios
  - Validar que `chartAccountId` pertence ao mesmo `tenantId`
  - Validar que `costCenterId` (se fornecido) pertence ao mesmo `tenantId`

### Frontend

**Serviço centralizado `financial.service.ts`:**
Todas as chamadas de API do módulo financeiro centralizar neste arquivo. Pattern já usado em `hospital-billing.service.ts`.

**Página CostCentersList:**
- Tabela Ant Design com colunas: Código, Nome, Tipo, Status
- Botão "Novo Centro de Custo" → abre modal de criação
- Filtros inline: tipo (CLINICO/ADMINISTRATIVO/APOIO), status (ativo/inativo)
- Actions por linha: Editar, Ativar/Desativar, Excluir

**Página ChartOfAccountsTree:**
- Exibir o plano de contas em `Tree` do Ant Design (componente `antd/Tree`)
- Nós raiz: RECEITAS (3) e DESPESAS (4)
- Expandir/colapsar hierarquia
- Badge colorido por tipo: RECEITA (verde), DESPESA (vermelho)
- Botão "Nova Conta" abre modal, com seleção do nó pai via dropdown

**Página FinancialTransactionsList:**
- Tabela paginada server-side
- Filtros: tipo (RECEITA/DESPESA), status, natureza, período de competência
- Tags coloridas por status: PENDENTE (amarelo), APROVADO (azul), PAGO (verde), CANCELADO (cinza)
- Actions: Ver detalhes, Aprovar, Marcar como Pago, Cancelar, Editar
- Totalizadores no topo: Total Receitas (verde), Total Despesas (vermelho), Resultado (azul)

**Página FinancialTransactionForm / Modal:**
- Formulário com React Hook Form + Zod
- Campos obrigatórios: tipo, natureza, conta do plano de contas (searchable Select), valor, dataCompetencia, descrição
- Campos opcionais: centro de custo, dataVencimento, formaPagamento, numeroDocumento, observações
- Validação client-side antes de enviar

## Regras Enterprise Obrigatórias

| Regra | Implementação |
|---|---|
| Multi-tenant | `tenantId` em todas as queries, extraído de `req.tenant.id` |
| Soft delete | `deletedAt: null` em todos os `findMany`/`findFirst` |
| Paginação | `buildPaginationQuery` + `buildPaginatedResult` em todos os `findAll` |
| Permissions | `@RequirePermissions({ module: 'faturamento', action: 'X' })` em todos os endpoints |
| Transactions ACID | `this.prisma.$transaction()` em operações que alteram múltiplas tabelas |
| Auditoria | `criadoPorId` gravado em todo lançamento; `aprovadoPorId` + `aprovadoEm` na aprovação |
| Validação | DTOs com `class-validator`, `ValidationPipe` já global |
| Swagger | `@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiProperty` em tudo |
| Performance | Índices Prisma definidos no schema; `select` apenas campos necessários nas listagens |
| Tipagem | Zero `any` nos arquivos de domínio e repositório; `any` permitido apenas em mappers |
| @TransformResponse | Aplicar em todos os endpoints `GET` de listagem |

## Riscos da Fase

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Conflito de nome de enum (`PaymentMethod`) com Prisma | Baixa | Verificar que não existe enum com esse nome no schema atual antes de criar |
| Circular dependency entre `FinancialModule` e `PrismaModule` | Muito baixa | `PrismaModule` é `@Global()` — não importar diretamente |
| Campo `criadoPorId` na relação `User` → problemas de FK | Média | Adicionar as relations com nomes semânticos (`TransactionCreator`, `TransactionApprover`) |
| Frontend quebrar ao adicionar rotas | Baixa | Adicionar rotas no final do router, sem remover existentes |

## Estratégia Anti-Quebra

1. **Não alterar nenhum model existente** nesta fase. Apenas adicionar novos.
2. **Não alterar controllers existentes.** O `FinancialController` é totalmente novo.
3. **Não alterar o `app.module.ts`** além de adicionar `FinancialModule` no final da lista de imports.
4. **Não alterar rotas existentes do frontend.** Adicionar apenas novas.
5. **Migrations aditivas:** Só `CREATE TABLE`, nunca `ALTER TABLE` em tabelas existentes nesta fase.
6. **Seed isolado:** Criar `prisma/seeds/financial-seed.ts` separado e chamá-lo via import no `seed.ts` principal — não misturar com dados clínicos existentes.

## Checklist de Conclusão da Fase 1

- [ ] Migration `add_cost_centers_and_chart_of_accounts` executada sem erro
- [ ] Migration `add_financial_transactions` executada sem erro
- [ ] `npx prisma generate` executado e sem erros
- [ ] Seed cria plano de contas e centros de custo padrão sem erro
- [ ] `GET /financial/cost-centers` retorna lista paginada com `{ data, total, page, limit }`
- [ ] `POST /financial/cost-centers` valida código único por tenant
- [ ] `GET /financial/chart-of-accounts` retorna hierarquia correta
- [ ] `GET /financial/transactions` retorna lista paginada com filtros funcionando
- [ ] `POST /financial/transactions` valida `chartAccountId` do tenant correto
- [ ] `PATCH /financial/transactions/:id/approve` impede auto-aprovação (criadoPorId ≠ aprovadoPorId)
- [ ] `PATCH /financial/transactions/:id/pay` exige `dataPagamento` e `formaPagamento`
- [ ] Zero erros TypeScript no backend (`npx tsc -p tsconfig.build.json --noEmit`)
- [ ] Zero erros TypeScript no frontend (`cd frontend && npx tsc --noEmit`)
- [ ] Swagger em `/api/docs` mostra todos os novos endpoints documentados
- [ ] Páginas `CostCentersList`, `ChartOfAccountsTree`, `FinancialTransactionsList` renderizam sem erro
- [ ] Formulário de lançamento valida campos obrigatórios antes de enviar

---

## ════════ PROMPT FINAL PARA O GEMINI PRO — FASE 1 ════════

```
Você está implementando a FASE 1 do módulo financeiro enterprise do sistema PEP+ (SaaS hospitalar multi-tenant).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO COMPLETO DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Stack obrigatória:
- Backend: NestJS + Prisma + PostgreSQL + Redis + BullMQ
- Frontend: React + TypeScript + Ant Design 5 + Zustand + React Hook Form + Zod
- Arquitetura: Clean Architecture (domain → application → infrastructure → presentation)
- Autenticação: JWT com RBAC granular por módulo/ação
- Multi-tenant: isolamento por tenantId em TODAS as queries
- Paginação: buildPaginationQuery() + buildPaginatedResult() (já existem)

Padrões obrigatórios que DEVEM ser respeitados (já existem no projeto):

1. MÓDULO NestJS (copiar padrão do UsersModule):
   - Controller → Use Case → Repository Interface → Prisma Repository
   - Token de injeção: export const X_REPOSITORY_TOKEN = Symbol('IXRepository')

2. QUERY DTO padrão (estender PaginationDto em src/shared/dto/pagination.dto.ts)

3. RESPONSE padrão com @TransformResponse() nos GET de listagem

4. PERMISSIONS: @RequirePermissions({ module: 'faturamento', action: 'criar|editar|visualizar' })

5. TENANT: req.tenant.id em todos os controllers (tipo: TenantRequest)

6. TODO lançamento/registro com: where: { tenantId, deletedAt: null }

Arquivos de referência que DEVEM ser analisados antes de implementar:
- src/modules/users/users.module.ts          (padrão de módulo)
- src/modules/users/users.controller.ts      (padrão de controller)
- src/shared/application/use-cases/users/users.use-cases.ts  (padrão de use-case)
- src/shared/domain/repositories/billing.repository.interface.ts  (padrão de interface)
- src/shared/infrastructure/database/prisma/repositories/prisma-billing.repository.ts  (padrão de repositório)
- src/shared/infrastructure/utils/prisma-pagination.util.ts  (paginação)
- src/shared/dto/pagination.dto.ts           (DTO base)
- src/modules/billing/dto/query-billing.dto.ts  (padrão de query DTO)
- src/shared/interceptors/transform.interceptor.ts  (transform response)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROIBIÇÕES ABSOLUTAS — NÃO FAÇA JAMAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ NÃO alterar nenhum model Prisma existente (BillingGuide, BillingItem, HospitalAccount, Patient, User, etc.)
❌ NÃO alterar controllers existentes (BillingController, HospitalBillingController, etc.)
❌ NÃO alterar use-cases existentes
❌ NÃO alterar o app.module.ts exceto para adicionar FinancialModule no final da lista de imports
❌ NÃO criar migrations que alterem tabelas existentes (apenas CREATE TABLE novas)
❌ NÃO remover nenhuma rota existente do frontend
❌ NÃO refatorar módulos fora do escopo desta fase
❌ NÃO criar abstrações desnecessárias
❌ NÃO implementar funcionalidades das fases 2-10 antecipadamente
❌ NÃO usar 'any' nos arquivos de domain e repositório
❌ NÃO usar strictNullChecks off (o projeto tem strictNullChecks: false no tsconfig — respeite isso)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
O QUE DEVE SER IMPLEMENTADO NESTA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSO 1 — SCHEMA PRISMA
Adicionar ao prisma/schema.prisma (NO FINAL DO ARQUIVO, após os modelos existentes):

Model CostCenter com campos:
  id (uuid), tenantId, codigo (String), nome (String), tipo (enum CostCenterType),
  codigoPai (String, opcional), ativo (Boolean, default true), descricao (String, opcional),
  createdAt, updatedAt, deletedAt (soft delete)
  Relation: tenant (Tenant), transactions (FinancialTransaction[])
  Unique: [tenantId, codigo]
  Indexes: [tenantId, deletedAt], [tenantId, tipo, deletedAt]

Model ChartOfAccounts com campos:
  id (uuid), tenantId, codigo (String), nome (String), tipo (enum AccountingType),
  natureza (enum AccountNature), codigoPai (String, opcional),
  aceitaLancamento (Boolean, default true), ativo (Boolean, default true), descricao (String, opcional),
  createdAt, updatedAt, deletedAt (soft delete)
  Relation: tenant (Tenant), transactions (FinancialTransaction[])
  Unique: [tenantId, codigo]
  Indexes: [tenantId, tipo, deletedAt], [tenantId, deletedAt]

Model FinancialTransaction com campos:
  id (uuid), tenantId, tipo (enum TransactionType), natureza (enum TransactionNature),
  chartAccountId (FK para ChartOfAccounts), costCenterId (FK opcional para CostCenter),
  descricao (String), valor (Float), dataCompetencia (DateTime),
  dataVencimento (DateTime, opcional), dataPagamento (DateTime, opcional),
  status (enum TransactionStatus, default PENDENTE),
  origemTipo (String, opcional — ex: 'BILLING_GUIDE'), origemId (String, opcional),
  numeroDocumento (String, opcional), formaPagamento (enum PaymentMethod, opcional),
  observacoes (String, opcional), criadoPorId (FK User, named relation "TransactionCreator"),
  aprovadoPorId (FK User opcional, named relation "TransactionApprover"), aprovadoEm (DateTime, opcional),
  createdAt, updatedAt, deletedAt (soft delete)
  Indexes: [tenantId, tipo, status, deletedAt], [tenantId, dataCompetencia, deletedAt],
           [tenantId, chartAccountId, deletedAt], [tenantId, costCenterId, deletedAt],
           [tenantId, origemTipo, origemId]

Enums a adicionar:
  CostCenterType: CLINICO, ADMINISTRATIVO, APOIO
  AccountingType: RECEITA, DESPESA, ATIVO, PASSIVO
  AccountNature: DEVEDORA, CREDORA
  TransactionType: RECEITA, DESPESA
  TransactionNature: CONVENIO, PARTICULAR, SUS, CUSTO_OPERACIONAL, SALARIO, OUTROS
  TransactionStatus: PENDENTE, APROVADO, PAGO, CANCELADO
  PaymentMethod: DINHEIRO, CARTAO_CREDITO, CARTAO_DEBITO, PIX, TED, DOC, CHEQUE, CONVENIO, SUS

Após editar o schema, gerar as migrations:
  migration 1: npx prisma migrate dev --name add_cost_centers_and_chart_of_accounts
  migration 2: npx prisma migrate dev --name add_financial_transactions
  Depois: npx prisma generate

PASSO 2 — DOMAIN LAYER (src/shared/domain/)

Criar 3 entidades de domínio (classes simples, sem dependência do Prisma):
  src/shared/domain/entities/cost-center.entity.ts
  src/shared/domain/entities/chart-of-accounts.entity.ts
  src/shared/domain/entities/financial-transaction.entity.ts

Criar 3 interfaces de repositório:
  src/shared/domain/repositories/cost-center.repository.interface.ts
  src/shared/domain/repositories/chart-of-accounts.repository.interface.ts
  src/shared/domain/repositories/financial-transaction.repository.interface.ts

Cada interface deve ter:
  CostCenterRepository: save, findById, findAll(tenantId, skip, take, filters), softDelete
  ChartOfAccountsRepository: save, findById, findAll(tenantId, skip, take), findByCode, softDelete
  FinancialTransactionRepository: save, findById, findAll(tenantId, skip, take, filters),
    updateStatus(id, tenantId, status, extras), softDelete

PASSO 3 — INFRASTRUCTURE LAYER (src/shared/infrastructure/database/prisma/repositories/)

Criar 3 repositórios Prisma implementando as interfaces:
  prisma-cost-center.repository.ts
  prisma-chart-of-accounts.repository.ts
  prisma-financial-transaction.repository.ts

Cada repositório deve:
  - Injetar PrismaService via constructor
  - Ter método privado toDomain() para mapear Prisma record → entity
  - Implementar soft delete: set deletedAt = new Date()
  - Filtrar deletedAt: null em todos os findMany/findFirst

PASSO 4 — APPLICATION LAYER (src/shared/application/use-cases/financial/)

Criar 3 use-cases:
  cost-center.use-cases.ts
  chart-of-accounts.use-cases.ts
  financial-transaction.use-cases.ts

Regras de negócio obrigatórias:
  CostCenterUseCases:
    - create: verificar código único no tenant antes de salvar
    - findAll: usar buildPaginationQuery + buildPaginatedResult
    - remove: soft delete

  ChartOfAccountsUseCases:
    - create: verificar código único no tenant; se codigoPai definido, validar que pai existe
    - findAll: retornar lista flat com buildPaginatedResult
    - getTree: método separado que monta a hierarquia em árvore (nós pai com children)
    - remove: verificar que a conta não tem lançamentos antes de deletar

  FinancialTransactionUseCases:
    - create: validar que chartAccountId pertence ao tenantId; validar aceitaLancamento=true na conta
    - findAll: filtros por tipo, status, natureza, chartAccountId, costCenterId,
               dataCompetenciaStart/End; usar buildPaginationQuery + buildPaginatedResult
    - approve: criadoPorId ≠ aprovadoPorId (lançar ForbiddenException se iguais);
               gravar aprovadoPorId e aprovadoEm; mudar status para APROVADO
    - pay: requer dataPagamento e formaPagamento; mudar status para PAGO
    - cancel: só pode cancelar se status ≠ PAGO; mudar para CANCELADO
    - update: só pode editar se status === PENDENTE

PASSO 5 — PRESENTATION LAYER (src/modules/financial/)

Criar estrutura:
  financial.module.ts
  financial.controller.ts
  dto/cost-center.dto.ts       (CreateCostCenterDto, UpdateCostCenterDto)
  dto/chart-of-accounts.dto.ts (CreateChartOfAccountsDto, UpdateChartOfAccountsDto)
  dto/financial-transaction.dto.ts (CreateTransactionDto, UpdateTransactionDto, ApproveTransactionDto, PayTransactionDto)
  dto/query-financial.dto.ts   (QueryTransactionsDto extends PaginationDto, QueryCostCentersDto extends PaginationDto)

Controller com endpoints:
  # Centros de Custo
  GET    /financial/cost-centers          @TransformResponse @RequirePermissions faturamento.visualizar
  POST   /financial/cost-centers          @RequirePermissions faturamento.criar
  GET    /financial/cost-centers/:id      @RequirePermissions faturamento.visualizar
  PATCH  /financial/cost-centers/:id      @RequirePermissions faturamento.editar
  DELETE /financial/cost-centers/:id      @RequirePermissions faturamento.excluir

  # Plano de Contas
  GET    /financial/chart-of-accounts     @TransformResponse @RequirePermissions faturamento.visualizar
  GET    /financial/chart-of-accounts/tree @RequirePermissions faturamento.visualizar  (sem TransformResponse — retorna estrutura de árvore)
  POST   /financial/chart-of-accounts     @RequirePermissions faturamento.criar
  GET    /financial/chart-of-accounts/:id @RequirePermissions faturamento.visualizar
  PATCH  /financial/chart-of-accounts/:id @RequirePermissions faturamento.editar

  # Lançamentos Financeiros
  GET    /financial/transactions              @TransformResponse @RequirePermissions faturamento.visualizar
  POST   /financial/transactions              @RequirePermissions faturamento.criar
  GET    /financial/transactions/:id          @RequirePermissions faturamento.visualizar
  PATCH  /financial/transactions/:id          @RequirePermissions faturamento.editar
  DELETE /financial/transactions/:id          @RequirePermissions faturamento.excluir
  PATCH  /financial/transactions/:id/approve  @RequirePermissions faturamento.editar
  PATCH  /financial/transactions/:id/pay      @RequirePermissions faturamento.editar
  PATCH  /financial/transactions/:id/cancel   @RequirePermissions faturamento.editar

Registrar FinancialModule no app.module.ts (adicionar ao final da lista de imports existente).

PASSO 6 — SEED FINANCEIRO (prisma/seeds/financial-seed.ts)

Criar seed separado com plano de contas padrão hospitalar (18 contas) e centros de custo padrão (11 centros).
Exportar função seedFinancialDefaults(prisma, tenantId) que usa upsert para idempotência.
Importar e chamar essa função no prisma/seed.ts principal.

PASSO 7 — FRONTEND

Criar frontend/src/modules/financial/services/financial.service.ts com todas as chamadas de API:
  getCostCenters, createCostCenter, updateCostCenter, deleteCostCenter
  getChartOfAccounts, getChartOfAccountsTree, createChartAccount, updateChartAccount
  getTransactions, createTransaction, getTransaction, updateTransaction,
  approveTransaction, payTransaction, cancelTransaction, deleteTransaction

Criar 4 páginas:
  frontend/src/modules/financial/pages/CostCentersList/index.tsx
    - Tabela Ant Design com colunas: Código, Nome, Tipo (tag colorida), Ativo (switch), Ações
    - Modal de criação/edição inline
    - Filtros: tipo, ativo

  frontend/src/modules/financial/pages/ChartOfAccountsTree/index.tsx
    - Componente Tree do Ant Design (antd Tree) mostrando hierarquia do plano de contas
    - Nós com ícones por tipo: RECEITA (verde DollarOutlined), DESPESA (vermelho MinusCircleOutlined)
    - Botão "Nova Conta" abre modal com seleção do pai

  frontend/src/modules/financial/pages/FinancialTransactionsList/index.tsx
    - Tabela paginada server-side com colunas: Data Competência, Descrição, Conta, Tipo, Valor, Status, Ações
    - Tags coloridas: PENDENTE=yellow, APROVADO=blue, PAGO=green, CANCELADO=gray
    - Totalizadores no cabeçalho da tabela: Total Receitas, Total Despesas, Resultado
    - Filtros: tipo, status, natureza, período de competência (DatePicker.RangePicker)
    - Botão "Novo Lançamento" abre TransactionFormModal

  frontend/src/modules/financial/components/TransactionFormModal/index.tsx
    - Modal com React Hook Form + Zod
    - Campos: tipo (Select: RECEITA/DESPESA), natureza (Select dinâmico baseado no tipo),
      conta do plano (Select com busca), centro de custo (Select opcional),
      descrição (Input), valor (InputNumber), dataCompetencia (DatePicker),
      dataVencimento (DatePicker, opcional), observações (TextArea)
    - Validação Zod completa antes de submeter

Adicionar ao frontend/src/routes/index.tsx (sem remover rotas existentes):
  /financial/cost-centers  → CostCentersList
  /financial/chart         → ChartOfAccountsTree
  /financial/transactions  → FinancialTransactionsList

Adicionar grupo "Financeiro" no Sidebar com links para as 3 novas páginas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALIDADE OBRIGATÓRIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Zero erros TypeScript (backend e frontend)
✅ Todos os endpoints documentados no Swagger
✅ Todas as listagens com buildPaginatedResult
✅ Todas as queries com tenantId e deletedAt: null
✅ Todos os endpoints com @RequirePermissions
✅ Todos os controllers com @ApiBearerAuth() e @UseGuards(JwtAuthGuard, PermissionsGuard)
✅ DTOs com class-validator decorators e @ApiProperty em todos os campos
✅ Repositórios com método toDomain() para mapear Prisma → Entity
✅ Use-cases com NotFoundException para registros não encontrados
✅ Seed com upsert (idempotente — pode rodar múltiplas vezes sem duplicar)
✅ Frontend com tipagem TypeScript (sem any[] implícito em useState)
✅ Frontend: formulários com validação Zod completa antes de submit
✅ Frontend: tratamento de erro nas chamadas de API (try/catch com message.error)
✅ Frontend: loading states em todas as operações assíncronas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VALIDAÇÃO FINAL DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Após implementar, confirme que:
1. npx tsc -p tsconfig.build.json --noEmit → 0 erros (exceto os 29 erros de TS2339 do prisma generate pendente)
2. cd frontend && npx tsc --noEmit → 0 erros novos além dos 24 existentes
3. GET /financial/cost-centers → { success: true, data: [], meta: { total: 0, ... } }
4. GET /financial/chart-of-accounts/tree → estrutura hierárquica de árvore
5. POST /financial/transactions com chartAccountId de outro tenant → 404
6. PATCH /financial/transactions/:id/approve com criadoPorId === aprovadoPorId → 403

NÃO implementar funcionalidades das Fases 2 a 10. Esta fase entrega APENAS:
- CostCenter CRUD
- ChartOfAccounts CRUD + Tree
- FinancialTransaction CRUD + workflow de aprovação e pagamento
- Seed com dados padrão
- 3 páginas frontend + 1 modal + 1 service
```

---

# ROADMAP DAS FASES 2 A 10 — VISÃO GERAL

*(Os prompts completos das Fases 2-10 serão gerados após validação da Fase 1)*

| Fase | Nome | Escopo Principal | Depende de |
|---|---|---|---|
| **1** | Fundação Financeira | CostCenter, ChartOfAccounts, FinancialTransaction CRUD | — |
| **2** | Integração Automática | Lançamentos auto de BillingGuide paga + HospitalAccount fechada | Fase 1 |
| **3** | Fluxo de Caixa e DRE | CashFlow diário, DRE mensal, KPIs, agregações Prisma | Fases 1-2 |
| **4** | Convênios e Contratos | InsuranceContract, InsurancePriceItem, AuthorizaçãoPrévia, TUSS | Fase 1 |
| **5** | Glosas Enterprise | BillingDenialItem, workflow de recurso, indicadores por convênio | Fases 1, 4 |
| **6** | Honorários Médicos | MedicalFee, BullMQ calculator, aprovação, PDF | Fases 1-3 |
| **7** | Dashboard Executivo | KPIs visuais, Recharts LineChart/PieChart/BarChart, alertas | Fases 1-6 |
| **8** | DRG e Análise Avançada | Análise custo DRG vs real, scatter chart, indicadores | Fases 1-3 |
| **9** | Auditoria Financeira | Audit trail completo, histórico de alterações, rastreabilidade | Fases 1-8 |
| **10** | Hardening Enterprise | Índices, idempotência, rate limit financeiro, performance final | Fases 1-9 |
