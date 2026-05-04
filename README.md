# 🏥 PEP+ (Prontuário Eletrônico do Paciente)
**Enterprise HealthTech ERP & B2B SaaS Platform**

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)

O **PEP+** é um ecossistema digital hospitalar de missão crítica, desenhado para gerenciar o ciclo de vida ponta a ponta do paciente e da operação clínica. Construído sobre uma arquitetura **Multi-tenant**, o sistema garante isolamento de dados de nível bancário, permitindo que a plataforma atenda desde policlínicas até redes de hospitais de grande porte em um modelo SaaS (Software as a Service).

---

## 🏗️ Arquitetura e Engenharia de Software

O sistema foi concebido utilizando princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e padrões SOLID, garantindo altíssima manutenibilidade, testabilidade e escalabilidade horizontal.

* **Multi-Tenancy (Isolamento de Dados):** Implementação de um `TenantMiddleware` nativo que intercepta e injeta o `tenantId` em todas as queries do Prisma ORM. Isso garante, em nível de banco de dados, que o vazamento de informações entre instituições distintas seja arquiteturalmente impossível.
* **Segurança e RBAC (Role-Based Access Control) Dinâmico:** Motor de permissões baseado em matrizes JSONB (PostgreSQL) com indexação GIN para respostas em milissegundos. Utiliza estratégia de **Deduplicação via Hash SHA-256** para evitar proliferação de perfis idênticos no banco de dados.
* **Conformidade LGPD e CFM:** Interceptador de Auditoria (`AuditInterceptor`) que registra automaticamente o rastreio (quem, quando, o quê, IP, User-Agent) de todas as mutações de dados (POST, PATCH, DELETE) guardando snapshots granulares na entidade `AuditLog`.
* **Processamento Assíncrono:** Utilização de **Redis** e **BullMQ** para enfileiramento e processamento de tarefas pesadas em background (ex: geração de relatórios de faturamento TISS, disparo de notificações).

---

## 🧬 Módulos e Regras de Negócio (Core Capabilities)

O PEP+ não é apenas um software de registro, mas um sistema de apoio à decisão clínica e gestão operacional.

### 🩺 1. Prontuário Eletrônico e Assistência (PEP)
* **Evolução Clínica e Histórico:** Versionamento criptografado de evoluções médicas e de enfermagem.
* **Painel Assistencial (Nursing Dashboard):** Gestão ativa de Sinais Vitais, Balanço Hídrico interativo e apuração automática de Escalas de Risco (Braden, Morse e Glasgow).
* **Kardex Digital:** Workflow de aprazamento, administração e checagem de medicações à beira-leito.

### 💊 2. Farmácia Clínica e Suprimentos
* **Rastreabilidade Total:** Controle de lotes, datas de validade e movimentação entre farmácias satélites (Centro Cirúrgico, UTI, Central).
* **Motor de Interações Medicamentosas:** Alertas clínicos automatizados baseados na severidade da interação entre drogas prescritas, garantindo a segurança do paciente.
* **Controle de Psicotrópicos (Portaria 344/98):** Log rigoroso de movimentação, perda e dispensação de medicamentos controlados.

### 🧪 3. Laboratório de Análises Clínicas (LIS)
* **Gestão de Amostras:** Geração de códigos de barras para rastreabilidade de tubos desde a coleta até o processamento.
* **Apoio Diagnóstico:** Validação de resultados contra faixas de referência (Idade/Sexo) e emissão de alertas de "Valores Críticos" (Risco Iminente).
* **Laudos:** Assinatura digital nativa para médicos patologistas.

### 🔪 4. Centro Cirúrgico e Rastreabilidade OPME
* **Mapa Cirúrgico:** Agendamento inteligente com alocação de recursos físicos (salas, equipamentos) e humanos (cirurgiões, anestesistas).
* **Cirurgia Segura (Protocolo OMS):** Implementação de checklists sistêmicos obrigatórios (Pré-operatório, Time Out, Sign Out e SRPA).
* **Gestão OPME (Anvisa):** Rastreabilidade de Órteses, Próteses e Materiais Especiais implantados, vinculando lote e registro da Anvisa diretamente ao prontuário e à conta hospitalar.

### 💰 5. Faturamento SUS e TISS (Financeiro)
* **Conta Hospitalar Dinâmica:** Apuração automática de consumo gerado pela equipe assistencial (taxas, diárias, gases, medicamentos, procedimentos).
* **Integração Operadora:** Estrutura preparada para o padrão de troca de informações da Saúde Suplementar (TISS/TUSS).
* **Glosas e DRG:** Fluxo de gestão de recursos de glosas e métricas baseadas em Diagnosis Related Groups (DRG).

### 👥 6. Gestão de Equipe e Governança (RH e TI)
* **Estrutura CBO Completa:** Cadastro de profissionais englobando conselhos de classe (CRM, COREN, CRF), CNS (Cartão Nacional de Saúde) obrigatório e departamentos de backoffice.
* **Governança de Acessos:** Geração automática de credenciais seguras e matriz visual para gestores de TI configurarem módulos permitidos por cargo.

---

## 💻 Stack Tecnológica Completa

| Camada | Tecnologias Utilizadas | Propósito |
|---|---|---|
| **Backend (API)** | NestJS, TypeScript, Node.js v18+ | Arquitetura modular, Injeção de Dependências e rotas RESTful REST/Swagger. |
| **Banco de Dados** | PostgreSQL 15+, Prisma ORM | Modelagem relacional, JSONB para flexibilidade, Migrations versionadas. |
| **Cache & Mensageria** | Redis, BullMQ | Filas de background, otimização de queries repetitivas e rate-limiting. |
| **Frontend (UI/UX)** | React 18, Vite, TypeScript | SPA de altíssima performance. |
| **State & Fetching** | Zustand, Axios | Gerenciamento de estado global otimizado sem boilerplate. |
| **UI Design System** | Ant Design 5 (Enterprise) | Componentes de classe corporativa, acessíveis e responsivos. |

---

## 🚀 Guia Rápido de Instalação (Ambiente de Desenvolvimento)

Para executar o ecossistema PEP+ localmente, certifique-se de possuir o **Docker**, **Docker Compose** e o **Node.js (v18+)** instalados.

### 1. Clonando o Repositório e Instalando Dependências
```bash
# Clone o monorepo
git clone [https://github.com/sua-organizacao/pep-hospitalar.git](https://github.com/sua-organizacao/pep-hospitalar.git)
cd pep-hospitalar

# Instale as dependências da API
npm install

# Instale as dependências da Aplicação Web
cd frontend
npm install
cd ..