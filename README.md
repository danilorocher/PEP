# 🏥 PEP+ (Prontuário Eletrônico do Paciente) - SaaS Hospitalar

O **PEP+** é um sistema completo de gestão de saúde (HealthTech SaaS) construído para suportar desde pequenas clínicas até hospitais de grande porte. O sistema abrange todo o ciclo de vida do paciente, incluindo Atendimento Clínico, Internação, Centro Cirúrgico, Farmácia, Laboratório (LIS), Faturamento e Gestão Administrativa, operando sob uma arquitetura de alta escalabilidade **Multi-tenant**.

---

## ✨ Principais Funcionalidades (Módulos)

### 🩺 Assistência e Clínica
* **Prontuário Eletrônico (PEP):** Evolução clínica, anamnese e histórico do paciente.
* **Prescrição Eletrônica:** Prescrição de medicamentos, exames e dietas com validação.
* **Assistência de Enfermagem:** Registro de sinais vitais, balanço hídrico e administração de medicamentos (Aprazamento/Kardex).
* **Escalas de Risco:** Avaliações clínicas automatizadas (Braden, Morse, Glasgow).

### 💊 Farmácia e Suprimentos
* **Gestão de Estoque:** Controle de lotes, validades e múltiplas farmácias (Central, UTI, etc.).
* **Dispensação Segura:** Fila de dispensação interligada com as prescrições médicas.
* **Medicamentos Controlados:** Log rigoroso de psicotrópicos e antibióticos (Exigência Anvisa).
* **Interações Medicamentosas:** Alertas automáticos de severidade entre drogas prescritas.

### 🔪 Centro Cirúrgico
* **Agendamento e Painel:** Mapa cirúrgico, controle de salas e recursos.
* **Checklists de Segurança:** Protocolo Cirurgia Segura da OMS (Pré e Pós-operatório).
* **Registros Médicos:** Ficha anestésica e Relatório cirúrgico.
* **Rastreabilidade OPME:** Controle de Órteses, Próteses e Materiais Especiais.

### 🧪 Laboratório (LIS)
* **Gestão de Coleta:** Geração de códigos de barras (barcodes) para tubos e amostras.
* **Análise e Resultados:** Lançamento de resultados com validação de valores de referência e alertas de "Valores Críticos".
* **Laudos:** Assinatura digital de laudos pelo médico patologista.

### 💰 Faturamento e Gestão (Financeiro)
* **Conta Hospitalar:** Apuração automática de consumo do paciente (Diárias, Medicamentos, Procedimentos).
* **Padrão TISS/SUS:** Geração de guias TISS, faturamento SUS (BPA/AIH) e controle de glosas.
* **DRG:** Classificação de Grupos de Diagnósticos Relacionados (Diagnosis Related Groups).

### 🔐 Segurança e Governança
* **Multi-tenant Nível Banco de Dados:** Isolamento completo de dados por unidade/hospital (`tenantId`).
* **RBAC Dinâmico e Matriz de Acessos:** Perfis baseados em permissões de granularidade fina (Acesso total, leitura, bloqueio por ação) gerenciados via painel visual.
* **Trilha de Auditoria (AuditLog):** Registro de "quem fez o quê e quando" (Em conformidade com a LGPD e conselhos médicos).

---

## 🛠️ Tecnologias Utilizadas

### Backend
* **[NestJS](https://nestjs.com/):** Framework Node.js progressivo para APIs eficientes e escaláveis.
* **[Prisma ORM](https://www.prisma.io/):** Modelagem de dados, migrações e consultas type-safe.
* **PostgreSQL:** Banco de dados relacional robusto (suporte avançado a colunas `JSONB`).
* **Redis & BullMQ:** Gerenciamento de cache e filas para processamento em background (ex: geração de relatórios).
* **JWT & Bcrypt:** Autenticação e criptografia de credenciais e dados sensíveis (LGPD).

### Frontend
* **[React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/):** Interface ultrarrápida e componentizada.
* **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática em toda a stack.
* **[Ant Design 5 (antd)](https://ant.design/):** Biblioteca de componentes UI Enterprise.
* **Zustand:** Gerenciamento de estado global simplificado.
* **Axios & React Router v6:** Requisições HTTP e roteamento dinâmico.

---

## 🏗️ Estrutura do Projeto

O repositório é um *Monorepo* que contém tanto a API (Backend) quanto a aplicação web (Frontend).

```text
pep-hospitalar/
├── prisma/                 # Schema do banco de dados e Migrations
├── src/                    # BACKEND (NestJS)
│   ├── modules/            # Módulos da aplicação (auth, patients, pharmacy, etc.)
│   ├── shared/             # Código compartilhado (Guards, Interceptors, Repositories)
│   └── main.ts             # Entry point da API
├── frontend/               # FRONTEND (React + Vite)
│   ├── src/
│   │   ├── modules/        # Telas e componentes isolados por domínio de negócio
│   │   ├── shared/         # Hooks, layouts e componentes globais
│   │   └── store/          # Estado global (Zustand)
│   └── vite.config.ts      # Configuração do bundler
├── docker-compose.yml      # Infraestrutura (Postgres, Redis)
└── package.json            # Dependências do Backend