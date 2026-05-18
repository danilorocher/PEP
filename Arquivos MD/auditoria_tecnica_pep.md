# AUDITORIA TÉCNICA PROFISSIONAL — PEP+ SaaS Hospitalar
### github.com/danilorocher/PEP
**Data:** Maio de 2026 | **Versão analisada:** 8.0.6

---

## NOTAS DE AUDITORIA
> Análise conduzida com clone fresh do repositório, compilação real do TypeScript, leitura integral dos arquivos críticos. Nenhum julgamento superficial.

---

## 1. RESUMO EXECUTIVO

O PEP+ é um sistema SaaS de Prontuário Eletrônico de Pacientes construído sobre NestJS + PostgreSQL + Prisma + React + Ant Design. O projeto demonstra **ambição arquitetural genuína** e domínio técnico acima da média para um projeto desenvolvido por IA generativa. Com 58 modelos Prisma, 27 módulos NestJS e 21 módulos frontend, o escopo é comparável ao de um MVP pago de startup healthtech.

**Veredicto direto:** O projeto está entre 55-60% do caminho para produção real. O backend compila sem erros estruturais, a arquitetura principal está correta, e a base de dados é sólida. Porém, há falhas críticas de segurança, 24 erros TypeScript no frontend que impedem compilação limpa, zero testes automatizados funcionais, ausência total de CI/CD, e bugs de runtime confirmados que bloqueiam fluxos essenciais.

---

## 2. ANÁLISE DA ESTRUTURA DO PROJETO

### 2.1 Organização Geral

**Positivo:**
- Separação clara `src/` (backend) / `frontend/` (React). Raiz limpa.
- Backend segue Clean Architecture com 4 camadas: `domain` → `application` → `infrastructure` → `modules`
- `shared/domain/repositories/` com interfaces (ports), implementações em `shared/infrastructure/`
- Módulos NestJS coesos: cada módulo tem seu controller, DTOs e referência ao use-case
- 27 módulos backend bem delimitados por domínio de negócio hospitalar

**Problemas:**
- `prisma.config.ts` existe na raiz mas o `schema.prisma` já tem `url = env("DATABASE_URL")`. Arquivo redundante sem uso claro.
- Pasta `Arquivos MD/` na raiz com prompts de desenvolvimento (`prompt_correcao_prescricoes.md`, `fix-senha.ts`). **Nunca deve estar em repositório público** — expõe o processo de desenvolvimento e arquivos de fix temporários.
- `src/modules/professionals/` existe mas tem apenas uma subpasta `constants/` — módulo fantasma. O backend usa `/doctors` e `/nurses` separados. Causa confusão.
- `src/app.controller.ts` e `src/app.service.ts` existem como boilerplate do NestJS CLI mas não fazem nada útil. Deveriam ser removidos.
- `prisma/seed-patients.ts` e `prisma/seed.ts` — dois seeds. Qual é o canônico?
- Comentários `// 🔥 NOVO` e `// 🔥 CORREÇÃO` espalhados pelo código indicam desenvolvimento incremental sem limpeza posterior. Em produção isso é ruído.

**Classificação:**
- Arquitetura: **7.5/10** — correta, porém com ruídos
- Organização: **6.5/10** — alguns módulos fantasmas e arquivos indevidos
- Maturidade: **MVP avançado** — não é improvisado, mas tem marcas de desenvolvimento assistido por IA

---

## 3. ERROS TÉCNICOS ENCONTRADOS

### 3.1 CRÍTICO — CORS Hardcoded com IP Privado

**Arquivo:** `src/main.ts` linha 15
**Código:**
```typescript
origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://192.168.8.84:3001'],
```

**Impacto:** Qualquer pessoa em rede diferente (outro IP, outra máquina, staging, produção) recebe bloqueio CORS. O browser transforma o erro CORS em falha de login. **Esta é a causa do bug "usuário e senha inválida" reportado.**

**Gravidade:** 🔴 CRÍTICA — bloqueia uso do sistema em produção.

**Correção:**
```typescript
// Desenvolvimento
origin: true,
// Produção
origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://app.pep.com']
```

---

### 3.2 CRÍTICO — bcrypt vs bcryptjs Inconsistência

**Arquivos:** `src/shared/application/use-cases/auth/login.use-case.ts` vs `prisma/seed.ts`

- Seed usa `import * as bcrypt from 'bcrypt'` com custo 10
- LoginUseCase usa `import * as bcrypt from 'bcryptjs'`

**Impacto:** `bcrypt` (nativo C++) e `bcryptjs` (JavaScript puro) geram hashes **compatíveis** via `compare()`. Não causa erro direto, mas é inconsistência técnica. Se o `bcrypt` nativo não compilar no ambiente (comum em Alpine Linux / Docker), o seed quebra enquanto o login funciona, ou vice-versa.

**Gravidade:** 🟡 MÉDIA — potencial falha de ambiente.

**Correção:** Padronizar para `bcryptjs` em todos os arquivos. Remover `bcrypt` do `package.json`.

---

### 3.3 CRÍTICO — 24 Erros TypeScript no Frontend (Não Compila Limpo)

**Arquivos afetados:**
1. `frontend/src/modules/surgical-center/components/ScheduleSurgeryModal/index.tsx` — **21 erros**
2. `frontend/src/modules/scheduling/pages/CalendarView/index.tsx` — **1 erro**
3. `frontend/src/modules/attendance/pages/DoctorWorklist/index.tsx` — **1 erro**
4. Outros — **1 erro**

**Causa do ScheduleSurgeryModal (21 erros):**
O Zod schema define apenas `{ prioridade: string }` mas o formulário usa 8 campos adicionais (`patientId`, `procedimento`, `dataCirurgia`, `salaId`, `cirurgiaoId`, `anestesistaId`, `enfermeiroId`, `observacoes`). O TypeScript infere o tipo do form como `{ prioridade: string }` e rejeita todos os outros campos.

**Causa do CalendarView:**
`import { AppointmentFormModal } from '../components/AppointmentFormModal'` — o diretório existe mas o path relativo está errado (`../components/` vs `./components/` dado o nível do arquivo).

**Gravidade:** 🔴 CRÍTICA — frontend não compila limpo. Em CI, o build quebraria.

---

### 3.4 CRÍTICO — N+1 Query por Request no PermissionsGuard

**Arquivo:** `src/shared/guards/permissions.guard.ts`

```typescript
// EXECUTA EM TODA REQUEST AUTENTICADA:
const userRecord = await this.prisma.user.findUnique({
  where: { id: user.sub, tenantId },
  include: { role: true },
});
```

**Impacto:** Cada request autenticada faz 1 SELECT no banco. Com 50 usuários simultâneos fazendo operações, são 50 queries/segundo só de autorização. Sem índice otimizado, isso degrada linearmente.

**Gravidade:** 🟡 ALTA em escala — aceitável para MVP, crítico em produção.

**Correção:** Cache Redis das permissões por usuário com TTL de 60s. Invalidar ao salvar permissões.

---

### 3.5 CRÍTICO — BullMQ com Lógica de Host Condicional

**Arquivo:** `src/app.module.ts`
```typescript
const host = rawHost === 'redis' ? 'localhost' : rawHost;
```

**Impacto:** Essa lógica força `localhost` quando o host é `redis` (nome do serviço Docker). Isso **quebra o Docker Compose** — dentro do container, `redis` é o hostname correto da rede Docker. Substituindo por `localhost`, a fila nunca conecta ao Redis em ambiente Docker.

**Gravidade:** 🔴 CRÍTICA — BullMQ não funciona no Docker.

**Correção:** Remover a substituição. Usar `REDIS_HOST` diretamente.

---

### 3.6 ALTA — `strictNullChecks: false` no tsconfig

**Arquivo:** `tsconfig.json`
```json
"strictNullChecks": false,
"noImplicitAny": false,
```

**Impacto:** TypeScript não verifica null/undefined. Erros de runtime que TypeScript normalmente capturaria passam despercebidos. Em um sistema hospitalar onde `null` em um campo de medicação pode ter consequências reais, isso é um risco.

**Gravidade:** 🟡 ALTA — reduz significativamente o valor do TypeScript.

---

### 3.7 ALTA — Prescrições com 4 Bugs de Runtime (já documentados)

Bugs confirmados na análise anterior mas não corrigidos no repositório:
1. `checkPrescriberPermission` compara `roleName` corretamente após correção do JWT — **CORRIGIDO** nesta versão
2. `setPrescriptions(response.data)` em vez de `response.data?.data || []` — **AINDA NÃO CORRIGIDO**
3. `api.post('/prescriptions')` em vez de `/medical-records/${recordId}/prescriptions` — **AINDA NÃO CORRIGIDO**
4. `dataInicio` ausente no formulário — **AINDA NÃO CORRIGIDO**

**Gravidade:** 🔴 CRÍTICA — módulo de prescrições não funciona.

---

### 3.8 MÉDIA — Docker Compose: API não faz `prisma generate`

**Arquivo:** `docker-compose.yml`
```yaml
command: sh -c "npx prisma migrate deploy && node dist/main.js"
```

O `Dockerfile` executa `npx prisma generate` no build stage. Mas a imagem de produção copia `node_modules` do builder que pode não ter o client gerado corretamente para o ambiente Alpine. O correto é executar `prisma generate` na imagem de produção antes de iniciar.

**Gravidade:** 🟡 MÉDIA — pode causar falha na primeira inicialização Docker.

---

### 3.9 MÉDIA — Seed Expõe Credenciais em Texto Claro

**Arquivo:** `prisma/seed.ts` linha 197
```typescript
console.log(`🚀 Acesse com: ${adminEmail} / Senha: Admin@2024!`);
```

**Impacto:** Credentials aparecem nos logs da aplicação. Em ambientes cloud com log aggregation (CloudWatch, Datadog), isso é um vazamento.

**Gravidade:** 🟡 MÉDIA — remover o console.log com senha.

---

### 3.10 LEVE — Dependência Desnecessária `@nestjs/schedule`

**Arquivo:** `src/app.module.ts`
```typescript
import { ScheduleModule } from '@nestjs/schedule';
```
Módulo importado com comentário `//` inline — parece que foi adicionado e deixado. Verificar se há `@Cron` decorators em uso; caso contrário, remover.

---

## 4. ANÁLISE DE SEGURANÇA

### 4.1 🔴 CORS com IP Privado Hardcoded
(detalhado em 3.1) — risco de segurança e funcionalidade.

### 4.2 🔴 Salt Hardcoded no EncryptionService

**Arquivo:** `src/shared/infrastructure/database/prisma/repositories/services/encryption.service.ts`
```typescript
this.key = crypto.scryptSync(secret, 'salt', 32);
```

O salt `'salt'` é literal. Em criptografia, salt deve ser aleatório e único por operação ou, no mínimo, por instância com valor secreto. Com salt fixo, dois sistemas com mesma `ENCRYPTION_KEY` derivam a mesma chave. Isso não é exploração direta, mas reduz a entropia e viola boas práticas de criptografia.

**Classificação:** Risco médio, facilidade de exploração baixa. Impacto se `ENCRYPTION_KEY` vazar: dados criptografados são decifráveis.

**Correção:**
```typescript
this.key = crypto.scryptSync(secret, process.env.ENCRYPTION_SALT || 'default_salt_change_me', 32);
```

### 4.3 🟡 JWT Secrets Fracos no `.env.example`

```
JWT_SECRET="chave_super_secreta_jwt_para_access_token_15m"
```

Se alguém subir em produção sem alterar o `.env.example`, qualquer pessoa pode forjar tokens JWT. O `.env.example` deveria ter placeholders sem valor: `JWT_SECRET=""`.

### 4.4 🟡 Master Admin Bypass no PermissionsGuard

```typescript
if (user && user.email === 'admin@pep.com') {
  return true; // libera TUDO
}
```

O email do admin master está hardcoded no guard. Se o email for comprometido (ou alguém descobrir que esse email tem acesso total), basta obter um token válido para ter permissão irrestrita. O bypass deveria ser baseado em um campo `isSuperAdmin: boolean` no banco, não no email.

### 4.5 🟢 O que está correto em segurança
- AES-256-GCM para CPF e CNS ✅
- bcrypt com custo 10-12 para senhas ✅
- Refresh Token armazenado no Redis com TTL ✅
- RBAC em tempo real (busca no banco, não no token) ✅
- ValidationPipe com whitelist ✅
- Rate limiting por tenant ✅
- Soft delete (dados nunca deletados) ✅
- Tenant isolation por `tenantId` em todas as queries ✅

---

## 5. ANÁLISE DEVOPS

### 5.1 Docker e Docker Compose

**Positivo:**
- Multi-stage Dockerfile correto (builder + production)
- Health checks em postgres e redis
- Volume persistente para postgres
- `restart: always` nos serviços
- `depends_on` com `condition: service_healthy`

**Problemas:**
- `api` service não tem health check próprio
- Redis sem senha (`requirepass`) — expõe Redis sem autenticação
- Portas expostas diretamente (`5432`, `6379`, `3000`) sem reverse proxy
- Sem limites de memória/CPU nos containers
- bull-board na porta 3001 sem autenticação — qualquer pessoa na rede vê as filas
- BullMQ host bug detalhado em 3.5 quebra o serviço dentro do Docker

### 5.2 CI/CD

**Não existe.** Nenhum arquivo `.github/workflows/`. Zero automação de:
- Build e testes em PR
- Verificação TypeScript
- Deploy automático
- Análise de dependências vulneráveis

**Gravidade:** 🔴 CRÍTICA para produção — deploys manuais são fonte de erros.

### 5.3 Observabilidade

- Logs estruturados via Winston **implementados** ✅
- Health check endpoint **implementado** ✅
- Sentry/Datadog: **não configurado**
- Métricas de performance: **ausentes**
- Alertas automatizados: **ausentes**

---

## 6. ANÁLISE DE FRONTEND

### 6.1 Pontos Positivos
- Zustand para estado global — leve e correto para SaaS
- React Hook Form + Zod — padrão moderno e tipado
- Ant Design 5 consistente em todos os módulos
- `usePermission` hook para RBAC no cliente
- Axios interceptor com refresh token automático
- Estrutura modular coerente com 21 módulos

### 6.2 Problemas

**24 erros TypeScript** impedem compilação limpa (detalhados em 3.3).

**`CalendarView` importa módulo com path errado** — tela de calendário quebra em runtime.

**`ScheduleSurgeryModal` com Zod schema incompleto** — o centro cirúrgico não funciona para agendamento.

**`DoctorWorklist` usa prop `success` em `Button`** — prop inexistente no Ant Design 5.

**Ausência de testes** — nenhum teste unitário ou de componente no frontend.

**Sem lazy loading** — todos os módulos carregam na inicialização. Com 21 módulos, isso impacta o tempo de carregamento inicial.

**Sem error boundaries** — uma exceção em qualquer componente pode derrubar toda a UI.

---

## 7. ANÁLISE DE BACKEND

### 7.1 Pontos Positivos
- **Clean Architecture rigorosa**: domain → application → infrastructure → presentation
- **Repository Pattern** com interfaces (ports) e implementações conjecturas
- **RBAC em tempo real** com PermissionsGuard buscando no banco
- **EncryptionService** aplicado nos campos sensíveis (CPF, CNS)
- **BullMQ** para processamento assíncrono (relatórios, notificações de medicação)
- **GlobalExceptionFilter** padronizando erros
- **TransformInterceptor** e **RequestIdInterceptor** para rastreabilidade
- **HealthController** com verificação de banco, Redis e memória
- **Multi-tenant** com middleware de subdomínio consistente

### 7.2 Problemas

**N+1 no PermissionsGuard** — query por request (detalhado em 3.4).

**BullMQ host condicional quebra Docker** (detalhado em 3.5).

**`strictNullChecks: false`** reduz segurança de tipos (detalhado em 3.6).

**Prescrições com bugs de runtime** não corrigidos (detalhado em 3.7).

**Seed inconsistente**: `seed.ts` e `seed-patients.ts` — qual roda com `prisma db seed`? O `package.json` aponta para `seed.ts`. O outro arquivo é órfão.

**`app.controller.ts`/`app.service.ts`** são boilerplate sem uso real.

---

## 8. VERIFICAÇÃO DE COMPLETUDE

### O que está realmente implementado e funcional (backend):
✅ Auth multi-tenant com JWT + Refresh Token
✅ Gestão de usuários, roles e permissões
✅ CRUD de médicos, enfermeiros, pacientes
✅ Alas, leitos e estrutura hospitalar
✅ Internação completa (admissão → alta)
✅ Agendamento de consultas
✅ Prontuário eletrônico com evoluções
✅ Prescrições (backend funcional, frontend com bugs)
✅ Medicações e controle de administração
✅ Exames e resultados
✅ Faturamento básico
✅ Farmácia hospitalar
✅ Sinais vitais, balanço hídrico, escalas (Braden/Morse/Glasgow)
✅ Centro cirúrgico (schema e backend)
✅ Laboratório (LIS básico)
✅ Faturamento hospitalar avançado (AIH/SUS/DRG)
✅ Relatórios assíncronos via BullMQ

### O que existe mas está quebrado/incompleto:
❌ Prescrições frontend (3 bugs de runtime)
❌ CalendarView de agendamento (import quebrado)
❌ ScheduleSurgeryModal centro cirúrgico (Zod schema incompleto — 21 erros)
❌ Pacientes não aparecem no modal de agendamento
❌ BullMQ não funciona no Docker

### O que está ausente:
❌ Testes automatizados (0% cobertura real funcional)
❌ CI/CD
❌ Notificações WebSocket
❌ Geração de PDF
❌ RNDS/FHIR R4 (obrigação legal)
❌ Assinatura digital ICP-Brasil (CFM 2299/2021)
❌ Seed completo do CID-10 (apenas 4-5 registros de teste)

---

## 9. RELATÓRIO FINAL PROFISSIONAL

### NOTAS POR CATEGORIA

| Categoria | Nota | Justificativa |
|---|---|---|
| **Qualidade Geral** | **6.2/10** | Backend sólido, frontend com erros, zero testes |
| **Arquitetura** | **7.8/10** | Clean Architecture real, RBAC correto, multi-tenant funcional |
| **Segurança** | **5.5/10** | CORS quebrado, salt hardcoded, admin bypass por email, sem HTTPS |
| **Organização** | **6.5/10** | Estrutura boa mas com ruídos, arquivos indevidos, módulos fantasmas |
| **Escalabilidade** | **5.8/10** | N+1 no guard, sem cache de permissões, sem lazy loading |
| **Profissionalismo** | **6.0/10** | Comentários de dev no código, zero CI/CD, 24 erros TS no frontend |

---

### PONTOS FORTES

1. **Arquitetura Clean genuína** — não é simulação. Domain, application, infrastructure e presentation estão separados corretamente com injeção de dependência e interfaces.
2. **Schema Prisma robusto** — 58 modelos que cobrem o domínio hospitalar real: da admissão à alta, da prescrição ao kardex farmacêutico, do centro cirúrgico ao faturamento SUS.
3. **RBAC em tempo real** — permissões buscadas no banco a cada request, garantindo que mudanças de perfil têm efeito imediato.
4. **Criptografia de dados sensíveis** — AES-256-GCM em CPF e CNS, com hash determinístico para busca.
5. **Multi-tenant real** — isolamento por `tenantId` consistente, middleware de extração por subdomínio.
6. **Infra moderna** — Redis para cache/sessions, BullMQ para filas, Docker Compose completo.
7. **Cobertura de domínio** — farmácia, centro cirúrgico, LIS, faturamento SUS/DRG — escopo raro mesmo em sistemas pagos.

---

### ERROS CRÍTICOS

1. **CORS hardcoded** — bloqueia uso em qualquer ambiente diferente do IP `192.168.8.84`
2. **BullMQ host logic** — quebra filas dentro do Docker
3. **24 erros TypeScript no frontend** — compilação suja
4. **Prescrições com 3 bugs não corrigidos** — fluxo essencial quebrado
5. **Zero CI/CD** — sem proteção contra regressões
6. **Zero testes funcionais** — 4 arquivos de spec mas sem implementação real

---

### ERROS MÉDIOS

1. `strictNullChecks: false` — reduz segurança de tipos
2. Salt hardcoded no EncryptionService
3. Admin bypass por email hardcoded no guard
4. `bcrypt` vs `bcryptjs` inconsistência
5. Docker sem Redis senha
6. bull-board exposto sem autenticação
7. Seed expõe senha em console.log
8. Arquivos de desenvolvimento na raiz do repositório (`Arquivos MD/`)

---

### ERROS LEVES

1. `app.controller.ts` e `app.service.ts` boilerplate sem uso
2. `src/modules/professionals/` módulo fantasma
3. `prisma.config.ts` redundante
4. `seed-patients.ts` órfão
5. Comentários `🔥 NOVO` espalhados
6. Sem lazy loading no frontend
7. Sem error boundaries

---

### RISCOS DE PRODUÇÃO

| Risco | Probabilidade | Impacto |
|---|---|---|
| CORS bloqueia usuários externos | Certeza | Login impossível |
| BullMQ não conecta no Docker | Certeza | Filas silenciosamente paradas |
| Deploy sem testes quebra funcionalidade | Alta | Regressões sem detecção |
| Redis sem senha exposto | Alta | Acesso não autorizado às filas |
| Bull-board sem auth | Alta | Exposição de dados de filas |

---

### O QUE ESTÁ PROFISSIONAL

- Arquitetura backend (Clean Architecture, DDD leve, RBAC)
- Schema de banco de dados (58 modelos, relacionamentos, índices)
- Isolamento multi-tenant
- Criptografia de dados pessoais (LGPD-ready)
- Interceptors de auditoria e transformação
- Health check endpoint
- Documentação Swagger

---

### O QUE AINDA PARECE AMADOR

- Zero testes — inaceitável para sistema hospitalar
- Zero CI/CD
- CORS hardcoded com IP doméstico privado
- Arquivos de processo de desenvolvimento commitados (`Arquivos MD/fix-senha.ts`)
- 24 erros TypeScript no frontend
- Comentários de IA no código (`// 🔥 NOVO`, `// 🔥 CORREÇÃO SÊNIOR`)
- Seed com `console.log` expondo senha

---

### ESTIMATIVA DE MATURIDADE

```
Backend arquitetural:     ████████░░  80%
Backend funcional:        ██████░░░░  65%
Frontend (erros TS):      █████░░░░░  55%
Testes:                   █░░░░░░░░░  5%
DevOps/CI/CD:             ██░░░░░░░░  20%
Segurança:                █████░░░░░  55%
Pronto para produção:     ████░░░░░░  40%
```

---

### ESTIMATIVA PARA PRODUÇÃO REAL

**O que precisa ser feito antes de produção:**

**Semana 1 (bloqueadores):**
- Corrigir CORS
- Corrigir BullMQ Docker host
- Corrigir 24 erros TypeScript frontend
- Corrigir 3 bugs de prescrições
- Adicionar Redis senha no Docker

**Semana 2-3 (segurança e qualidade):**
- Implementar CI/CD básico (GitHub Actions)
- Corrigir `strictNullChecks`
- Cache de permissões no Redis
- Testes unitários nos use-cases críticos
- Remover arquivos de desenvolvimento do repositório

**Semana 4+ (compliance):**
- Lazy loading no frontend
- Error boundaries
- Seed completo do CID-10
- Assinatura digital (CFM 2299/2021)
- HTTPS/TLS configurado no Docker Compose

---

### NOTA FINAL GERAL: 6.2/10

**Contexto:** Para um sistema desenvolvido com IA generativa, esta nota representa trabalho acima da média. A arquitetura principal está correta — algo que muitos projetos humanos acertam menos. Os problemas são corrigíveis em 2-4 semanas de trabalho focado.

**Para chegar a 8/10:** Corrigir os 6 erros críticos, adicionar 70% de cobertura de testes, implementar CI/CD e resolver os problemas de segurança apontados.

**Para estar em produção hospitalar real:** Além do acima, RNDS/FHIR R4, assinatura digital ICP-Brasil, e auditoria de segurança por terceiro independente são obrigações legais no contexto do CFM.
