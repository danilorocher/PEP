# PEP+ — PROMPTS DE MELHORIA PARA O GEMINI PRO
> Envie um prompt por vez. Aguarde a entrega completa antes de avançar.
> Contexto: Backend NestJS + Prisma + PostgreSQL + Redis + BullMQ. Frontend React + Ant Design + Zustand.

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M1 — FILTRO GLOBAL DE EXCEÇÕES E PADRONIZAÇÃO DE RESPOSTAS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS + Prisma + PostgreSQL), implemente um sistema de tratamento de erros padronizado e profissional.

## Contexto do projeto
- NestJS com Clean Architecture (domain/application/infrastructure)
- Prisma ORM com PostgreSQL
- Multi-tenant com tenantId em todas as entidades
- Todos os erros atualmente chegam ao cliente sem padronização

## O que implementar

### 1. Filtro Global de Exceções (`src/shared/filters/global-exception.filter.ts`)
Criar um `@Catch()` global que:
- Capture todos os erros da aplicação (HttpException, PrismaClientKnownRequestError, ValidationError, Error genérico)
- Retorne sempre o mesmo formato JSON:
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Mensagem amigável para o usuário",
  "details": ["array de detalhes se houver"],
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/patients",
  "requestId": "uuid-gerado-por-request"
}
```
- Tratar especificamente os erros Prisma:
  - `P2002` (unique constraint) → 409 Conflict com mensagem "Já existe um registro com esses dados"
  - `P2025` (not found) → 404 Not Found com mensagem "Registro não encontrado"
  - `P2003` (foreign key) → 400 Bad Request com mensagem "Referência inválida"
  - `P2014` (relation violation) → 400 Bad Request
- Logar erros 5xx com stack trace completo
- Nunca expor stack trace em produção (`NODE_ENV === 'production'`)

### 2. Request ID Interceptor (`src/shared/interceptors/request-id.interceptor.ts`)
- Gerar UUID v4 para cada request
- Injetar no header `X-Request-ID` da resposta
- Disponibilizar via `AsyncLocalStorage` para ser usado no filtro de exceções e nos logs

### 3. Response Transform Interceptor (`src/shared/interceptors/transform.interceptor.ts`)
- Envolver todas as respostas de sucesso no formato:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "...",
    "requestId": "..."
  }
}
```
- Para listas paginadas, incluir:
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### 4. Registrar no main.ts e app.module.ts
- Filtro global via `app.useGlobalFilters()`
- Interceptors via `APP_INTERCEPTOR` no AppModule

## Entregáveis
1. `src/shared/filters/global-exception.filter.ts`
2. `src/shared/interceptors/request-id.interceptor.ts`
3. `src/shared/interceptors/transform.interceptor.ts`
4. `src/main.ts` atualizado
5. `src/app.module.ts` atualizado com os interceptors
6. Testes unitários do filtro de exceções cobrindo cada tipo de erro Prisma

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M2 — PAGINAÇÃO UNIVERSAL E PERFORMANCE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS + Prisma), implemente paginação padronizada e otimizações de performance em todos os módulos de listagem.

## Contexto
- Projeto usa Clean Architecture: use-cases chamam repositórios Prisma
- Alguns módulos já têm paginação parcial mas inconsistente
- Em hospitais grandes, listagens sem paginação causam timeout e esgotamento de memória

## O que implementar

### 1. DTO de Paginação Base (`src/shared/dto/pagination.dto.ts`)
```typescript
// Criar PaginationDto com:
// - page: number (min 1, default 1)
// - limit: number (min 1, max 100, default 10)
// - search?: string (busca textual genérica)
// - orderBy?: string (campo de ordenação)
// - order?: 'ASC' | 'DESC' (default DESC por createdAt)
// Adicionar @ApiProperty com exemplos em todos os campos
```

### 2. Interface de Resposta Paginada (`src/shared/domain/interfaces/paginated-result.interface.ts`)
```typescript
// PaginatedResult<T> com:
// - data: T[]
// - total: number
// - page: number
// - limit: number
// - totalPages: number
// - hasNext: boolean
// - hasPrev: boolean
```

### 3. Utilitário de Paginação Prisma (`src/shared/infrastructure/utils/prisma-pagination.util.ts`)
```typescript
// Função buildPaginationQuery(page, limit) que retorna { skip, take }
// Função buildPaginatedResult<T>(data, total, page, limit) que retorna PaginatedResult<T>
```

### 4. Aplicar paginação em TODOS os findAll dos módulos
Aplicar nos seguintes módulos (todos têm o mesmo padrão de use-case + repositório):
- `patients` — adicionar busca por nome, CPF (parcial), convênio
- `doctors` — adicionar filtro por especialidade, status, busca por nome/CRM
- `nurses` — filtro por categoria, status, podePrescrever
- `users` — filtro por role, status, busca por nome/email
- `medications` — filtro por tipo, controleEspecial, busca por nome/princípioAtivo
- `exams` — filtro por tipo, busca por nome/codigoTUSS
- `hospitalizations` — filtro por status, ala, médico, data de entrada
- `appointments` — filtro por médico, data, status, paciente
- `audit` (AuditLog) — filtro por userId, entidade, data range
- `billing` — filtro por convênio, status, data range

### 5. Cache Redis para listagens frequentes
Implementar no `RedisService` o método:
```typescript
async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T>
```
Aplicar cache de 60 segundos nas listagens de:
- Catálogo de medicamentos
- Catálogo de exames
- Lista de especialidades médicas
- CID-10 (cache de 24h)
- Ocupação de leitos por ala (cache de 30s — atualizado no Redis quando leito muda de status)

## Entregáveis
1. `src/shared/dto/pagination.dto.ts`
2. `src/shared/domain/interfaces/paginated-result.interface.ts`
3. `src/shared/infrastructure/utils/prisma-pagination.util.ts`
4. Todos os 10 módulos com findAll paginado e filtros aplicados
5. Cache Redis nos 5 endpoints mencionados
6. DTOs de query (QueryPatientsDto, QueryDoctorsDto, etc.) com filtros tipados e documentados no Swagger

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M3 — TESTES UNITÁRIOS E DE INTEGRAÇÃO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS + Jest + Prisma), implemente uma suíte de testes abrangente cobrindo os módulos críticos do sistema hospitalar.

## Contexto
- Projeto usa Clean Architecture: use-cases são independentes do Prisma (dependem de interfaces de repositório)
- Isso facilita testes: mockar o repositório é simples
- Atualmente há apenas 3 arquivos de teste vazios
- Framework: Jest (já configurado no package.json)

## Estrutura de testes a implementar

### 1. Testes Unitários — Use Cases críticos

**Auth (`src/shared/application/auth/__tests__/login.use-case.spec.ts`)**
- Login com credenciais válidas → retorna accessToken + refreshToken
- Login com senha incorreta → lança UnauthorizedException
- Login com usuário inativo → lança ForbiddenException
- Login com tenant inválido → lança NotFoundException
- Geração de token JWT com claims corretos (sub, tenantId, role)

**Patients (`src/shared/application/use-cases/patients/__tests__/patients.use-cases.spec.ts`)**
- Criar paciente com CPF válido → sucesso com MedicalRecord criado automaticamente
- Criar paciente com CPF inválido (dígitos verificadores) → lança BadRequestException
- Criar paciente com CPF duplicado no tenant → lança ConflictException
- Buscar paciente de outro tenant → lança NotFoundException (isolamento multi-tenant)
- Soft delete de paciente com internação ativa → lança BadRequestException

**Prescriptions (`src/shared/application/use-cases/prescriptions/__tests__/prescriptions.use-cases.spec.ts`)**
- Médico criando prescrição → sucesso + MedicationAdministration gerados para cada horário
- Enfermeiro sem podePrescrever tentando prescrever → lança ForbiddenException
- Enfermeiro com podePrescrever → sucesso
- Suspender prescrição → items futuros marcados como NAO_MINISTRADO

**Hospitalizations (`src/shared/application/use-cases/hospitalizations/__tests__/hospitalizations.use-cases.spec.ts`)**
- Admitir paciente em leito livre → sucesso + leito muda para OCUPADO
- Admitir paciente em leito OCUPADO → lança ConflictException
- Alta hospitalar sem CID-10 → lança BadRequestException
- Alta hospitalar sem sumário → lança BadRequestException
- Alta correta → leito volta para LIVRE

**EncryptionService (`src/shared/infrastructure/database/prisma/repositories/services/__tests__/encryption.service.spec.ts`)**
- Criptografar e descriptografar CPF → valor original recuperado
- Criptografar mesmo valor duas vezes → resultados diferentes (IV aleatório)
- Hash determinístico (para busca) → mesmo hash para mesmo valor
- Valor corrompido → lança erro na descriptografia

### 2. Testes de Integração — Controllers

**Auth Controller (`src/modules/auth/__tests__/auth.controller.spec.ts`)**
- POST /auth/login com body válido → 200 com tokens
- POST /auth/login com body inválido → 400
- POST /auth/refresh com refresh token válido → 200 com novo accessToken
- POST /auth/logout → 200 e token removido do Redis

**Patients Controller (`src/modules/patients/__tests__/patients.controller.spec.ts`)**
- GET /patients sem auth → 401
- GET /patients sem permissão → 403
- POST /patients com dados válidos → 201
- POST /patients com CPF duplicado → 409

### 3. Factory de mocks reutilizável (`src/shared/testing/`)

Criar helpers de teste:
```typescript
// mock-prisma.service.ts — PrismaService mockado
// mock-redis.service.ts — RedisService mockado
// factories/patient.factory.ts — gera Patient de teste
// factories/doctor.factory.ts — gera Doctor de teste
// factories/user.factory.ts — gera User de teste com role
// factories/tenant.factory.ts — gera Tenant de teste
```

### 4. Configuração de cobertura no package.json
```json
"jest": {
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Entregáveis
1. Testes unitários dos 5 use-cases críticos (≥ 30 testes no total)
2. Testes de integração dos 2 controllers
3. Pasta `src/shared/testing/` com mocks e factories
4. `package.json` atualizado com threshold de cobertura
5. Script `npm run test:cov` funcionando e atingindo ≥ 70% de cobertura

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M4 — LOGS ESTRUTURADOS E MONITORAMENTO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS), implemente logs estruturados em JSON com Winston e prepare a aplicação para monitoramento em produção.

## Contexto
- Atualmente usa o `Logger` padrão do NestJS (apenas console, sem estrutura)
- Em produção, logs precisam ser em JSON para ingestão por ferramentas como Datadog, CloudWatch, Grafana Loki
- O `AuditInterceptor` já registra ações mas usa `Logger.log()` simples
- Sistema hospitalar exige rastreabilidade completa por questões legais (CFM)

## O que implementar

### 1. Winston Logger customizado (`src/shared/infrastructure/logger/`)

**`winston.logger.ts`**
- Logger com dois transportes:
  - `Console`: em desenvolvimento, formato colorido e legível
  - `Console` em produção: formato JSON puro (para coleta por agentes externos)
- Campos obrigatórios em todo log JSON:
  ```json
  {
    "timestamp": "ISO8601",
    "level": "info|warn|error|debug",
    "service": "pep-plus",
    "environment": "production",
    "requestId": "uuid-do-request",
    "tenantId": "uuid-do-tenant",
    "userId": "uuid-do-usuario",
    "message": "...",
    "context": "NomeDoModulo",
    "duration_ms": 45,
    "metadata": {}
  }
  ```
- Nível de log configurável via variável de ambiente `LOG_LEVEL` (default: `info` em prod, `debug` em dev)

**`logger.module.ts`** — módulo global que provê o logger

**`logger.service.ts`** — serviço wrapper que injeta o `requestId` e `tenantId` automaticamente via `AsyncLocalStorage`

### 2. Substituir Logger padrão do NestJS
- Configurar o Winston como logger padrão do NestJS em `main.ts`
- Substituir todos os `new Logger()` dos módulos pelo `LoggerService` injetável

### 3. Logs de performance automáticos
No `AuditInterceptor` (já existente), adicionar:
- Tempo de resposta de cada request em ms
- Log de warning automático quando request demorar mais de 2000ms
- Log de error quando request demorar mais de 5000ms

### 4. Health Check endpoint (`src/modules/health/`)
Usando `@nestjs/terminus`, criar endpoint `GET /health` que verifica:
- `database`: conexão com PostgreSQL via Prisma
- `redis`: conexão com Redis via ping
- `memory`: uso de memória heap (warning se > 80%)
- `disk`: espaço em disco (warning se > 90%)

Resposta esperada:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "memory": { "status": "up", "used": "512MB" }
  }
}
```

### 5. Adicionar variáveis no .env.example
```
LOG_LEVEL=info
LOG_FORMAT=json
SENTRY_DSN=          # opcional, para integração futura
```

## Entregáveis
1. `src/shared/infrastructure/logger/winston.logger.ts`
2. `src/shared/infrastructure/logger/logger.module.ts`
3. `src/shared/infrastructure/logger/logger.service.ts`
4. `src/modules/health/health.module.ts` e `health.controller.ts`
5. `src/main.ts` atualizado com Winston como logger padrão
6. `.env.example` atualizado com variáveis de log

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M5 — CI/CD COM GITHUB ACTIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS + React + Docker + PostgreSQL), crie um pipeline CI/CD completo com GitHub Actions.

## Contexto
- Repositório no GitHub: github.com/danilorocher/PEP
- Backend: NestJS com TypeScript
- Frontend: React com Vite e TypeScript
- Banco: PostgreSQL (testes usam banco em memória/test container)
- Containerização: Docker + Docker Compose
- Não usar Docker nos testes unitários (apenas nos de integração)

## Workflows a criar

### 1. CI — Pull Request e Push para main (`.github/workflows/ci.yml`)
Disparado em: `push` para `main` e `develop`, e `pull_request` para `main`

**Jobs em paralelo:**

**Job `backend-lint-and-types`**
- Node.js 20
- `npm ci`
- `npx tsc -p tsconfig.build.json --noEmit` (checar tipos)
- `npm run lint` (ESLint)

**Job `backend-test`**
- Node.js 20
- Serviço PostgreSQL 15 no GitHub Actions (para testes de integração)
- Serviço Redis 7 no GitHub Actions
- `npm ci`
- `npx prisma generate`
- `npx prisma migrate deploy` (banco de test)
- `npm run test` (unitários)
- `npm run test:cov` (com cobertura)
- Upload do relatório de cobertura como artefato
- Falha se cobertura < 70%

**Job `frontend-lint-and-types`**
- `cd frontend && npm ci`
- `npx tsc --noEmit`
- `npm run lint`

**Job `docker-build`**
- Apenas no push para `main`
- Build da imagem Docker do backend
- Verificar que a imagem builda sem erros

### 2. CD — Deploy (`.github/workflows/cd.yml`)
Disparado em: push de tag `v*.*.*` (ex: `v1.0.0`)

- Build e push da imagem Docker para GitHub Container Registry (ghcr.io)
- Tag da imagem com a versão e `latest`
- Criar GitHub Release automaticamente com changelog gerado pelo git log

### 3. Dependabot (`.github/dependabot.yml`)
- Checar atualizações de dependências npm semanalmente (backend e frontend separados)
- Checar atualizações de actions GitHub mensalmente

### 4. Linting config (`eslint.config.js` ou `.eslintrc.js`)
Se não existir, criar configuração ESLint para o backend:
- Extends: `@typescript-eslint/recommended`
- Regras: `no-console: warn`, `no-unused-vars: error`, `@typescript-eslint/explicit-function-return-type: warn`

## Secrets necessários no GitHub
Documentar no README quais secrets precisam ser configurados:
- `POSTGRES_URL` — banco de staging para CD
- `REDIS_URL` — Redis de staging

## Entregáveis
1. `.github/workflows/ci.yml`
2. `.github/workflows/cd.yml`
3. `.github/dependabot.yml`
4. `eslint.config.js` (se não existir)
5. Atualização do `README.md` com badge de CI e instruções de secrets

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M6 — NOTIFICAÇÕES EM TEMPO REAL (WEBSOCKET)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS + React + BullMQ), implemente notificações em tempo real via WebSocket para eventos críticos do sistema hospitalar.

## Contexto
- Backend já tem BullMQ configurado — workers processam jobs de medicação e relatórios
- Frontend usa Ant Design com sistema de notificações
- Eventos críticos que precisam de notificação em tempo real:
  - Medicação atrasada (worker verifica a cada 15min)
  - Resultado de exame crítico disponível
  - Novo paciente admitido na ala
  - Alta hospitalar solicitada
  - Alerta de interação medicamentosa na farmácia

## O que implementar

### 1. Gateway WebSocket (`src/modules/notifications/notifications.gateway.ts`)
Usando `@nestjs/websockets` com `socket.io`:
- Autenticação via JWT no handshake (`socket.handshake.auth.token`)
- Salas por tenant: `socket.join(`tenant:${tenantId}`)`
- Salas por ala: `socket.join(`ward:${wardId}`)`
- Salas por usuário: `socket.join(`user:${userId}`)`
- Eventos emitidos:
  - `medication:overdue` — medicação atrasada (sala da ala)
  - `exam:critical_result` — resultado crítico (sala do médico solicitante)
  - `patient:admitted` — novo paciente (sala da ala)
  - `patient:discharge_requested` — alta solicitada (sala do médico responsável)
  - `drug:interaction_alert` — interação medicamentosa (sala do farmacêutico)

### 2. Serviço de Notificações (`src/modules/notifications/notifications.service.ts`)
- Método `emit(event, room, payload)` para enviar notificações
- Método `broadcast(event, tenantId, payload)` para broadcast no tenant
- Salvar notificações não lidas no Redis (lista por usuário, TTL 24h):
  ```
  key: notifications:{tenantId}:{userId}
  ```
- Endpoint REST para buscar notificações não lidas: `GET /notifications/unread`
- Endpoint para marcar como lida: `PATCH /notifications/:id/read`

### 3. Integrar nos workers BullMQ existentes
No `MedicationProcessor` (já existente), após detectar medicação atrasada:
```typescript
await this.notificationsService.emit('medication:overdue', `ward:${wardId}`, {
  patientName, medicationName, scheduledAt, minutesLate
});
```

No `ExamRequestsUseCases.registerResult()`, ao registrar resultado crítico:
```typescript
// Verificar se valor está fora do range crítico (campo no modelo ExamRequest)
// Se sim, emitir notification para o médico solicitante
```

### 4. Frontend — Hook de notificações (`frontend/src/shared/hooks/useNotifications.ts`)
```typescript
// Conectar ao WebSocket com o token JWT
// Escutar eventos e adicionar ao store de notificações
// Mostrar notification.warning() do Ant Design para alertas críticos
// Mostrar badge de contador no sino do Header
```

### 5. Frontend — Componente NotificationCenter
- Sino no Header com badge de contagem de não lidas
- Dropdown com lista das últimas 10 notificações
- Cada notificação com ícone por tipo, texto, timestamp e botão "marcar como lida"
- Link para navegar ao contexto da notificação (ex: clicar em "medicação atrasada" abre a ala)

## Entregáveis
1. `src/modules/notifications/notifications.gateway.ts`
2. `src/modules/notifications/notifications.service.ts`
3. `src/modules/notifications/notifications.module.ts`
4. `src/modules/notifications/dto/notification.dto.ts`
5. Integração nos workers BullMQ e use-cases de exames
6. `frontend/src/shared/hooks/useNotifications.ts`
7. `frontend/src/shared/components/NotificationCenter/index.tsx`
8. Header atualizado com NotificationCenter

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M7 — EXPORTAÇÃO DE DOCUMENTOS (PDF)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (NestJS + BullMQ), implemente geração de documentos PDF para os principais documentos médicos do sistema.

## Contexto
- Backend NestJS com BullMQ para processamento assíncrono
- Geração de PDF deve ser assíncrona (não pode bloquear a API)
- Documentos médicos com valor legal precisam de estrutura específica
- Usar a biblioteca `@react-pdf/renderer` no backend (Node.js) ou `puppeteer` para renderizar HTML → PDF

## Documentos a implementar

### 1. Prescrição Médica (PDF)
Campos obrigatórios pelo CFM:
- Cabeçalho: nome do hospital/clínica, endereço, telefone, logo
- Dados do médico: nome, CRM, especialidade
- Dados do paciente: nome, data de nascimento, CPF (parcial: ***.***.***-**)
- Data e hora da prescrição
- Lista de medicamentos: nome, dosagem, via, frequência, horários, duração
- Campo de assinatura (linha + "Assinatura e Carimbo do Médico")
- Rodapé: "Documento gerado pelo PEP+ em {timestamp} | Não substitui o documento original assinado"

### 2. Sumário de Alta Hospitalar (PDF)
Campos obrigatórios:
- Dados da internação: data entrada, data alta, número do leito, ala
- Diagnóstico de admissão (CID-10) e diagnóstico de alta (CID-10)
- Médico responsável
- Resumo da evolução clínica (campo texto)
- Medicamentos em uso na alta
- Orientações de alta
- Condição do paciente na alta
- Próximas consultas agendadas
- Assinatura do médico de alta

### 3. Resultado de Exame (PDF)
- Dados do laboratório/serviço
- Dados do paciente
- Exame solicitado e médico solicitante
- Data de coleta e data do resultado
- Resultado com valores de referência
- Assinatura do responsável pelo resultado

### 4. Relatório de Ocupação (PDF)
- Cabeçalho com data/hora de geração
- Tabela de alas com: nome, tipo, capacidade, ocupados, livres, taxa %
- Gráfico simples de barras (em texto/ASCII ou imagem embutida)
- Lista de pacientes internados por ala

## Implementação técnica

**Serviço de PDF (`src/shared/infrastructure/pdf/pdf.service.ts`)**
- Usar `puppeteer` (mais confiável para documentos complexos com CSS)
- Método `generate(template: string, data: object): Promise<Buffer>`
- Templates HTML em `src/shared/infrastructure/pdf/templates/`

**Processamento assíncrono via BullMQ**
- Queue `pdf-generation`
- Job criado quando usuário solicita o documento
- Job armazena o PDF gerado no sistema de arquivos temporário (`/tmp/pep/pdfs/`)
- Retorna URL de download com expiração de 1 hora

**Endpoints REST**
- `POST /prescriptions/:id/pdf` → enfileira geração, retorna `{ jobId }`
- `POST /hospitalizations/:id/discharge-summary/pdf` → idem
- `POST /exam-requests/:id/result/pdf` → idem
- `GET /documents/:jobId/download` → retorna o arquivo ou status do job

## Entregáveis
1. `src/shared/infrastructure/pdf/pdf.service.ts`
2. `src/shared/infrastructure/pdf/templates/` (4 templates HTML)
3. `src/modules/documents/documents.module.ts` e `documents.controller.ts`
4. Worker BullMQ `src/queues/pdf.processor.ts`
5. Botões "Gerar PDF" no frontend nas telas de Prescrição, Alta e Exames
6. Modal de progresso + link de download no frontend

---

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PROMPT M8 — ROTA /ASSISTANCE E CORREÇÃO DOS 19 ERROS TYPESCRIPT DO FRONTEND
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No projeto PEP+ (React + TypeScript + Ant Design + Zustand), corrija os 19 erros TypeScript do frontend e registre a rota do módulo Assistance que está sem rota.

## Lista exata dos 19 erros a corrigir

### Erros no FluidBalance (`src/modules/assistance/components/FluidBalance/index.tsx`)
1. `'dropDownOutlined'` não existe em `@ant-design/icons` → renomear para `DownOutlined`
2. `Input` não está importado → adicionar `Input` ao import do `antd`

### Erros no BillingItemsModal (`src/modules/billing/components/BillingItemsModal/index.tsx`)
3. `Typography.Text` com prop `size` que não existe no Ant Design 5 → remover `size="small"` e usar `style={{ fontSize: '12px' }}`

### Erros no MedicalRecordView (`src/modules/medical-records/pages/MedicalRecordView/index.tsx`)
4. `Type 'string' is not assignable to type 'null'` na linha 92 → tipar o estado como `useState<{ visible: boolean; id: string | null }>({ visible: false, id: null })`

### Erros no PatientForm (`src/modules/patients/pages/PatientForm/index.tsx`)
5. `FieldError` não é `ReactNode` → usar `help={errors.campo?.message as string}`

### Erros no NurseForm — 5 erros TS2322 (`src/modules/professionals/pages/NurseForm/index.tsx`)
6-10. O `Controller` do `react-hook-form` infere o tipo errado do campo `podePrescrever` (boolean) para inputs de string → reescrever o arquivo com `const control = ctrl as any` após `useForm()`

### Erros no Scheduling (`src/modules/scheduling/pages/Scheduling/index.tsx`)
11. Prop `selectedDate` não existe na interface `AppointmentFormModalProps` → remover essa prop do JSX

### Erros no StructureList (`src/modules/structure/pages/StructureList/index.tsx`)
12-13. `useState([])` infere `never[]` → usar `useState<any[]>([])`

### Erros no Header (`src/shared/components/Header/index.tsx`)
14. `menuItems` com tipo `ItemType[]` incompatível → adicionar `as any` no array
15. `user?.role` não é `ReactNode` → renderizar como `typeof user?.role === 'string' ? user.role : (user?.role as any)?.nome ?? ''`

### Correção adicional — Reports
16. `NodeJS.Timeout` não disponível sem `@types/node` → usar `ReturnType<typeof setInterval>`

### Correção adicional — useAuthStore
17-18. Interface `User` incompleta → adicionar campos `roleName?: string`, `permissoes?: Record<string, Record<string, boolean>>`

### Correção adicional — tsconfig.json do frontend
19. `import.meta.env` não reconhecido → adicionar `"vite/client"` ao array `types` do `compilerOptions`

## Além dos erros: adicionar rota do módulo Assistance
Os componentes já existem em `frontend/src/modules/assistance/` mas não há rota no router:
- Adicionar em `frontend/src/routes/index.tsx`:
  - `import { ClinicalDashboardPage } from '../modules/assistance/components/ClinicalDashboard'`
  - Rota `/assistance` renderizando `<ClinicalDashboardPage />`
- Adicionar no menu do Sidebar:
  - Item "Assistência ao Paciente" com ícone `HeartOutlined` e link `/assistance`

## Entregáveis
1. Todos os 19 arquivos corrigidos sem nenhum erro TypeScript (`npx tsc --noEmit` retorna 0 erros)
2. `frontend/src/routes/index.tsx` com rota `/assistance`
3. Sidebar com item de menu para Assistance
4. Confirmação final: `npx tsc --noEmit` retorna 0 erros

---

# 📌 ORDEM DE EXECUÇÃO RECOMENDADA

| Prompt | Conteúdo | Prioridade | Impacto |
|--------|----------|-----------|---------|
| **M8** | Corrigir 19 erros TypeScript + rota Assistance | 🔴 Imediata | Frontend compila |
| **M1** | Filtro global de exceções + padronização | 🔴 Alta | API profissional |
| **M2** | Paginação universal + cache Redis | 🔴 Alta | Performance |
| **M3** | Testes unitários e de integração | 🟡 Alta | Qualidade |
| **M4** | Logs estruturados + health check | 🟡 Média | Monitoramento |
| **M5** | CI/CD GitHub Actions | 🟡 Média | Deploy |
| **M6** | WebSocket — notificações em tempo real | 🟢 Média | UX |
| **M7** | Geração de PDF de documentos médicos | 🟢 Média | Funcionalidade |
