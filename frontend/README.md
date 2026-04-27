# 🏥 PEP+ (Prontuário Eletrônico de Pacientes) - Frontend

Este é o frontend do sistema hospitalar PEP+, construído com foco em alta performance, multi-tenancy e conformidade com as diretrizes do CFM e LGPD.

## 🚀 Tecnologias Utilizadas

* **Framework:** React.js (v18)
* **Linguagem:** TypeScript
* **Build Tool:** Vite
* **Gerenciamento de Estado:** Zustand
* **Roteamento:** React Router v6
* **UI/UX:** Ant Design (antd)
* **Formulários e Validação:** React Hook Form + Zod
* **Requisições HTTP:** Axios
* **Gráficos:** Recharts
* **Manipulação de Datas:** Day.js

## 📁 Estrutura de Diretórios (Clean Architecture)

```text
src/
 ├── app/              # Configurações globais e entry point (App.tsx)
 ├── modules/          # Módulos funcionais da aplicação
 │   ├── auth/         # Autenticação e troca de senha
 │   ├── dashboard/    # Gráficos e indicadores
 │   ├── patients/     # Gestão de pacientes
 │   ├── professionals/# Corpo clínico (Médicos e Enfermeiros)
 │   ├── structure/    # Gestão de alas e leitos
 │   ├── scheduling/   # Agendamento de consultas
 │   ├── hospitalizations/ # Fluxo de internação e alta
 │   ├── medical-records/  # Prontuário eletrônico e evoluções
 │   ├── prescriptions/    # Prescrição médica
 │   ├── medication/   # Administração de medicamentos (Enfermagem)
 │   ├── billing/      # Faturamento (TISS Básico)
 │   └── reports/      # Relatórios assíncronos e exportação
 ├── routes/           # Definição e proteção de rotas
 ├── shared/           # Código compartilhado entre módulos
 │   ├── components/   # Componentes de UI genéricos (Layout, Header, Sidebar, etc.)
 │   ├── hooks/        # Custom hooks (ex: usePermission para RBAC)
 │   └── services/     # Serviços globais (ex: instância do Axios)
 └── store/            # Gerenciamento de estado global (Zustand)