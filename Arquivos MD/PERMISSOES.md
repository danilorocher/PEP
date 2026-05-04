# PROMPT — MATRIZ DE PERMISSÕES PROFISSIONAL NO PEP+
## Para usar no Gemini Pro — Versão Validada

---

## CONTEXTO COMPLETO DO PROJETO

Você está trabalhando no sistema **PEP+**, um SaaS hospitalar com:

- **Backend:** NestJS + Prisma + PostgreSQL + Redis
- **Frontend:** React + TypeScript + Ant Design 5 + Zustand + React Router v6
- **RBAC:** O guard `PermissionsGuard` busca permissões **em tempo real no banco** a cada request

### Como o RBAC funciona hoje

Cada `User` tem um `roleId` que aponta para um `Role`. O `Role` tem um campo JSON `permissoes`:

```json
{
  "pacientes":   { "criar": true,  "editar": true, "visualizar": true, "excluir": false },
  "prescricao":  { "criar": true,  "visualizar": true },
  "medicacao":   { "administrar": true, "visualizar": true },
  "exames":      { "solicitar": true, "liberar": false, "visualizar": true },
  "internacao":  { "admitir": true, "alta": true, "visualizar": true, "criar": true },
  "faturamento": { "criar": false, "editar": false, "visualizar": true },
  "relatorios":  { "visualizar": true, "exportar": false },
  "sistema":     { "administrar": false }
}
```

**Mapeamento completo real** (extraído dos controllers existentes):

| Módulo | Ações Disponíveis |
|---|---|
| `pacientes` | criar, editar, visualizar, excluir |
| `agendamento` | criar, editar, visualizar, cancelar |
| `prontuario` | criar, editar, visualizar, excluir |
| `prescricao` | criar, editar, visualizar, excluir |
| `medicacao` | administrar, visualizar, criar, editar |
| `exames` | solicitar, liberar, visualizar, criar |
| `internacao` | admitir, alta, visualizar, criar |
| `medicos` | criar, editar, visualizar, excluir |
| `enfermeiros` | criar, editar, visualizar, excluir |
| `usuarios` | criar, editar, visualizar, excluir |
| `alas` | criar, editar, visualizar, excluir |
| `leitos` | criar, editar, visualizar, excluir |
| `faturamento` | criar, editar, visualizar, excluir |
| `relatorios` | visualizar, exportar |
| `roles` | criar, editar, visualizar, excluir |
| `sistema` | administrar |

### Situação atual do formulário de profissionais

Em `frontend/src/modules/professionals/pages/ProfessionalForm/index.tsx` existe um Card:
```tsx
<Card title={<><SafetyCertificateOutlined /> Acesso ao Sistema PEP</>}>
  <Switch name="criarAcessoSistema" />
  {criarAcesso && (
    <>
      <Input name="loginEmail" />
      <Select name="perfilAcesso">
        <Option value="MEDICO">Médico</Option>       {/* hardcoded — não usa o banco */}
        <Option value="ENFERMEIRO">Enfermagem</Option>
        <Option value="RECEPCAO">Recepção</Option>
        <Option value="FINANCEIRO">Faturamento</Option>
        <Option value="ADMIN">Administrador</Option>
      </Select>
    </>
  )}
</Card>
```

**Problema:** O `perfilAcesso` é uma string hardcoded. O backend exige `roleId` (UUID real de um Role do banco). O formulário atualmente chama `POST /professionals` que **não existe no backend** — o backend tem rotas separadas `/doctors`, `/nurses`, `/users`.

### Endpoints do backend que vamos usar (JÁ EXISTEM)

- `GET /roles` — lista os perfis de acesso do tenant (retorna `{ id, nome, permissoes }[]`)
- `POST /roles` — cria um novo perfil
- `PATCH /roles/:id` — atualiza as permissões de um perfil
- `POST /users` — cria login para um colaborador (`body: { roleId, nomeCompleto, cpf, email }`)
- `PATCH /users/:id` — edita usuário existente

---

## O QUE IMPLEMENTAR

### 1. Constante de Templates de Permissão (Backend)

**Criar:** `src/shared/constants/permission-templates.constant.ts`

```typescript
export type PermissionsMap = Record<string, Record<string, boolean>>;

export interface PermissionTemplate {
  label: string;
  descricao: string;
  cor: string;
  icone: string;
  permissoes: PermissionsMap;
}

export const PERMISSION_TEMPLATES: Record<string, PermissionTemplate> = {
  ADMINISTRADOR: {
    label: 'Administrador',
    descricao: 'Acesso total ao sistema — TI e Direção',
    cor: '#ff4d4f',
    icone: 'CrownOutlined',
    permissoes: {
      pacientes:   { criar: true,  editar: true,  visualizar: true,  excluir: true  },
      agendamento: { criar: true,  editar: true,  visualizar: true,  cancelar: true },
      prontuario:  { criar: true,  editar: true,  visualizar: true,  excluir: true  },
      prescricao:  { criar: true,  editar: true,  visualizar: true,  excluir: true  },
      medicacao:   { administrar: true, visualizar: true, criar: true, editar: true  },
      exames:      { solicitar: true, liberar: true, visualizar: true, criar: true   },
      internacao:  { admitir: true, alta: true, visualizar: true, criar: true        },
      medicos:     { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      enfermeiros: { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      usuarios:    { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      alas:        { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      leitos:      { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      faturamento: { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      relatorios:  { visualizar: true, exportar: true                                },
      roles:       { criar: true,  editar: true,  visualizar: true,  excluir: true   },
      sistema:     { administrar: true                                               },
    },
  },
  MEDICO: {
    label: 'Médico',
    descricao: 'Prescrição, prontuário e solicitação de exames',
    cor: '#1677ff',
    icone: 'MedicineBoxOutlined',
    permissoes: {
      pacientes:   { criar: true,  editar: true,  visualizar: true,  excluir: false },
      agendamento: { criar: true,  editar: true,  visualizar: true,  cancelar: true },
      prontuario:  { criar: true,  editar: true,  visualizar: true,  excluir: false },
      prescricao:  { criar: true,  editar: true,  visualizar: true,  excluir: false },
      medicacao:   { administrar: false, visualizar: true, criar: false, editar: false },
      exames:      { solicitar: true, liberar: false, visualizar: true, criar: false  },
      internacao:  { admitir: true, alta: true, visualizar: true, criar: true         },
      medicos:     { criar: false, editar: false, visualizar: true,  excluir: false   },
      enfermeiros: { criar: false, editar: false, visualizar: true,  excluir: false   },
      usuarios:    { criar: false, editar: false, visualizar: false, excluir: false   },
      alas:        { criar: false, editar: false, visualizar: true,  excluir: false   },
      leitos:      { criar: false, editar: false, visualizar: true,  excluir: false   },
      faturamento: { criar: false, editar: false, visualizar: false, excluir: false   },
      relatorios:  { visualizar: true, exportar: false                                },
      roles:       { criar: false, editar: false, visualizar: false, excluir: false   },
      sistema:     { administrar: false                                               },
    },
  },
  ENFERMEIRO: {
    label: 'Enfermeiro(a)',
    descricao: 'Administração de medicação, evolução e triagem',
    cor: '#13c2c2',
    icone: 'HeartOutlined',
    permissoes: {
      pacientes:   { criar: true,  editar: true,  visualizar: true,  excluir: false },
      agendamento: { criar: false, editar: false, visualizar: true,  cancelar: false},
      prontuario:  { criar: true,  editar: false, visualizar: true,  excluir: false },
      prescricao:  { criar: false, editar: false, visualizar: true,  excluir: false },
      medicacao:   { administrar: true, visualizar: true, criar: false, editar: false},
      exames:      { solicitar: false, liberar: false, visualizar: true, criar: false},
      internacao:  { admitir: false, alta: false, visualizar: true, criar: false     },
      medicos:     { criar: false, editar: false, visualizar: true,  excluir: false  },
      enfermeiros: { criar: false, editar: false, visualizar: true,  excluir: false  },
      usuarios:    { criar: false, editar: false, visualizar: false, excluir: false  },
      alas:        { criar: false, editar: false, visualizar: true,  excluir: false  },
      leitos:      { criar: false, editar: false, visualizar: true,  excluir: false  },
      faturamento: { criar: false, editar: false, visualizar: false, excluir: false  },
      relatorios:  { visualizar: false, exportar: false                              },
      roles:       { criar: false, editar: false, visualizar: false, excluir: false  },
      sistema:     { administrar: false                                              },
    },
  },
  RECEPCIONISTA: {
    label: 'Recepcionista',
    descricao: 'Cadastro de pacientes e agendamento',
    cor: '#722ed1',
    icone: 'TeamOutlined',
    permissoes: {
      pacientes:   { criar: true,  editar: true,  visualizar: true,  excluir: false },
      agendamento: { criar: true,  editar: true,  visualizar: true,  cancelar: true },
      prontuario:  { criar: false, editar: false, visualizar: false, excluir: false },
      prescricao:  { criar: false, editar: false, visualizar: false, excluir: false },
      medicacao:   { administrar: false, visualizar: false, criar: false, editar: false},
      exames:      { solicitar: false, liberar: false, visualizar: true, criar: false },
      internacao:  { admitir: false, alta: false, visualizar: true, criar: false      },
      medicos:     { criar: false, editar: false, visualizar: true,  excluir: false   },
      enfermeiros: { criar: false, editar: false, visualizar: true,  excluir: false   },
      usuarios:    { criar: false, editar: false, visualizar: false, excluir: false   },
      alas:        { criar: false, editar: false, visualizar: true,  excluir: false   },
      leitos:      { criar: false, editar: false, visualizar: true,  excluir: false   },
      faturamento: { criar: false, editar: false, visualizar: false, excluir: false   },
      relatorios:  { visualizar: false, exportar: false                               },
      roles:       { criar: false, editar: false, visualizar: false, excluir: false   },
      sistema:     { administrar: false                                               },
    },
  },
  FARMACEUTICO: {
    label: 'Farmacêutico(a)',
    descricao: 'Gestão de estoque, dispensação e validação de prescrições',
    cor: '#52c41a',
    icone: 'ExperimentOutlined',
    permissoes: {
      pacientes:   { criar: false, editar: false, visualizar: true,  excluir: false },
      agendamento: { criar: false, editar: false, visualizar: false, cancelar: false},
      prontuario:  { criar: false, editar: false, visualizar: true,  excluir: false },
      prescricao:  { criar: false, editar: false, visualizar: true,  excluir: false },
      medicacao:   { administrar: false, visualizar: true, criar: true, editar: true },
      exames:      { solicitar: false, liberar: false, visualizar: true, criar: false},
      internacao:  { admitir: false, alta: false, visualizar: true, criar: false     },
      medicos:     { criar: false, editar: false, visualizar: true,  excluir: false  },
      enfermeiros: { criar: false, editar: false, visualizar: false, excluir: false  },
      usuarios:    { criar: false, editar: false, visualizar: false, excluir: false  },
      alas:        { criar: false, editar: false, visualizar: true,  excluir: false  },
      leitos:      { criar: false, editar: false, visualizar: false, excluir: false  },
      faturamento: { criar: false, editar: false, visualizar: false, excluir: false  },
      relatorios:  { visualizar: true, exportar: false                               },
      roles:       { criar: false, editar: false, visualizar: false, excluir: false  },
      sistema:     { administrar: false                                              },
    },
  },
  FATURAMENTO: {
    label: 'Faturamento',
    descricao: 'Guias, convênios, TISS e relatórios financeiros',
    cor: '#fa8c16',
    icone: 'DollarOutlined',
    permissoes: {
      pacientes:   { criar: false, editar: false, visualizar: true,  excluir: false },
      agendamento: { criar: false, editar: false, visualizar: true,  cancelar: false},
      prontuario:  { criar: false, editar: false, visualizar: false, excluir: false },
      prescricao:  { criar: false, editar: false, visualizar: false, excluir: false },
      medicacao:   { administrar: false, visualizar: false, criar: false, editar: false},
      exames:      { solicitar: false, liberar: false, visualizar: true, criar: false },
      internacao:  { admitir: false, alta: false, visualizar: true, criar: false      },
      medicos:     { criar: false, editar: false, visualizar: true,  excluir: false   },
      enfermeiros: { criar: false, editar: false, visualizar: false, excluir: false   },
      usuarios:    { criar: false, editar: false, visualizar: false, excluir: false   },
      alas:        { criar: false, editar: false, visualizar: true,  excluir: false   },
      leitos:      { criar: false, editar: false, visualizar: true,  excluir: false   },
      faturamento: { criar: true,  editar: true,  visualizar: true,  excluir: false   },
      relatorios:  { visualizar: true, exportar: true                                 },
      roles:       { criar: false, editar: false, visualizar: false, excluir: false   },
      sistema:     { administrar: false                                               },
    },
  },
  SOMENTE_LEITURA: {
    label: 'Somente Leitura',
    descricao: 'Apenas visualização — auditores e gestores externos',
    cor: '#8c8c8c',
    icone: 'EyeOutlined',
    permissoes: {
      pacientes:   { criar: false, editar: false, visualizar: true,  excluir: false },
      agendamento: { criar: false, editar: false, visualizar: true,  cancelar: false},
      prontuario:  { criar: false, editar: false, visualizar: true,  excluir: false },
      prescricao:  { criar: false, editar: false, visualizar: true,  excluir: false },
      medicacao:   { administrar: false, visualizar: true, criar: false, editar: false},
      exames:      { solicitar: false, liberar: false, visualizar: true, criar: false },
      internacao:  { admitir: false, alta: false, visualizar: true, criar: false      },
      medicos:     { criar: false, editar: false, visualizar: true,  excluir: false   },
      enfermeiros: { criar: false, editar: false, visualizar: true,  excluir: false   },
      usuarios:    { criar: false, editar: false, visualizar: false, excluir: false   },
      alas:        { criar: false, editar: false, visualizar: true,  excluir: false   },
      leitos:      { criar: false, editar: false, visualizar: true,  excluir: false   },
      faturamento: { criar: false, editar: false, visualizar: false, excluir: false   },
      relatorios:  { visualizar: true, exportar: false                                },
      roles:       { criar: false, editar: false, visualizar: false, excluir: false   },
      sistema:     { administrar: false                                               },
    },
  },
};
```

---

### 2. Endpoint de Templates (Backend)

**Modificar:** `src/modules/roles/roles.module.ts` e criar `src/modules/roles/permissions.controller.ts`

```typescript
// permissions.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PERMISSION_TEMPLATES } from '../../shared/constants/permission-templates.constant';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  @Get('templates')
  getTemplates() {
    return Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => ({
      key,
      label: template.label,
      descricao: template.descricao,
      cor: template.cor,
      icone: template.icone,
      permissoes: template.permissoes,
    }));
  }
}
```

Registrar o `PermissionsController` no `RolesModule`.

---

### 3. Definição da Matriz de Módulos (Frontend)

**Criar:** `frontend/src/modules/professionals/constants/permissions-definition.ts`

```typescript
// Define a estrutura visual da tabela — qual ação aparece em qual coluna
export interface ModuleDefinition {
  key: string;          // chave no JSON de permissões (ex: 'pacientes')
  label: string;        // nome exibido (ex: 'Pacientes')
  grupo: string;        // grupo na tabela (ex: 'Assistência ao Paciente')
  acoes: {
    key: string;        // chave da ação (ex: 'criar')
    label: string;      // label da coluna (ex: 'Criar')
    coluna: 'criar' | 'editar' | 'visualizar' | 'excluir' | 'especial1' | 'especial2';
    labelEspecial?: string; // se for ação especial, qual o label (ex: 'Administrar')
  }[];
}

export const MODULES_DEFINITION: ModuleDefinition[] = [
  // ─── Assistência ao Paciente ───────────────────────────────────────
  {
    key: 'pacientes', label: 'Pacientes', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'criar',      label: 'Criar',       coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',      coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar',  coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',     coluna: 'excluir'    },
    ],
  },
  {
    key: 'agendamento', label: 'Agendamento', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'cancelar',   label: 'Cancelar',   coluna: 'especial1', labelEspecial: 'Cancelar' },
    ],
  },
  {
    key: 'prontuario', label: 'Prontuário Eletrônico', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'prescricao', label: 'Prescrição Médica', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'medicacao', label: 'Medicação (Enfermagem)', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'administrar', label: 'Administrar', coluna: 'especial1', labelEspecial: 'Administrar' },
      { key: 'visualizar',  label: 'Visualizar',  coluna: 'visualizar' },
      { key: 'criar',       label: 'Criar/Editar',coluna: 'criar'      },
    ],
  },
  {
    key: 'exames', label: 'Exames', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'solicitar',  label: 'Solicitar', coluna: 'especial1', labelEspecial: 'Solicitar' },
      { key: 'liberar',    label: 'Liberar',   coluna: 'especial2', labelEspecial: 'Liberar'   },
      { key: 'visualizar', label: 'Visualizar',coluna: 'visualizar' },
    ],
  },
  {
    key: 'internacao', label: 'Internação / Alta', grupo: 'Assistência ao Paciente',
    acoes: [
      { key: 'admitir',    label: 'Admitir',    coluna: 'especial1', labelEspecial: 'Admitir' },
      { key: 'alta',       label: 'Alta',       coluna: 'especial2', labelEspecial: 'Alta'    },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
    ],
  },

  // ─── Estrutura Hospitalar ──────────────────────────────────────────
  {
    key: 'alas', label: 'Alas / Setores', grupo: 'Estrutura Hospitalar',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'leitos', label: 'Leitos', grupo: 'Estrutura Hospitalar',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },

  // ─── Gestão de Equipe ──────────────────────────────────────────────
  {
    key: 'medicos', label: 'Médicos', grupo: 'Gestão de Equipe',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'enfermeiros', label: 'Enfermeiros', grupo: 'Gestão de Equipe',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'usuarios', label: 'Usuários do Sistema', grupo: 'Gestão de Equipe',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'roles', label: 'Perfis de Acesso', grupo: 'Gestão de Equipe',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },

  // ─── Financeiro ────────────────────────────────────────────────────
  {
    key: 'faturamento', label: 'Faturamento / TISS', grupo: 'Financeiro',
    acoes: [
      { key: 'criar',      label: 'Criar',      coluna: 'criar'      },
      { key: 'editar',     label: 'Editar',     coluna: 'editar'     },
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'excluir',    label: 'Excluir',    coluna: 'excluir'    },
    ],
  },
  {
    key: 'relatorios', label: 'Relatórios', grupo: 'Financeiro',
    acoes: [
      { key: 'visualizar', label: 'Visualizar', coluna: 'visualizar' },
      { key: 'exportar',   label: 'Exportar',   coluna: 'especial1', labelEspecial: 'Exportar' },
    ],
  },

  // ─── Sistema ───────────────────────────────────────────────────────
  {
    key: 'sistema', label: 'Administração do Sistema', grupo: 'Sistema',
    acoes: [
      { key: 'administrar', label: 'Administrar', coluna: 'especial1', labelEspecial: 'Administrar Total' },
    ],
  },
];
```

---

### 4. Componente Principal: AccessPermissionsPanel

**Criar:** `frontend/src/modules/professionals/components/AccessPermissionsPanel/index.tsx`

Este componente substitui completamente o Card "Acesso ao Sistema PEP" no `ProfessionalForm`.

**Props do componente:**
```typescript
interface AccessPermissionsPanelProps {
  // Controlado pelo Form do Ant Design do componente pai
  value?: {
    criarAcesso: boolean;
    loginEmail: string;
    roleId?: string;           // UUID do Role existente (edição)
    permissoes: PermissionsMap;
    perfilBase: string;        // ex: 'MEDICO', 'PERSONALIZADO'
  };
  onChange?: (value: any) => void;
  // Dados do profissional (para preencher defaults)
  nomeProfissional?: string;
  emailProfissional?: string;
  cpfProfissional?: string;
}
```

**Estrutura visual obrigatória:**

**Seção A — Toggle Principal**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔐 Acesso ao Sistema PEP                                        │
│  ════════════════════════                                        │
│  [Switch] Habilitar acesso ao sistema para este colaborador      │
│           Ao ativar, um login será criado e as permissões        │
│           poderão ser configuradas abaixo.                       │
└──────────────────────────────────────────────────────────────────┘
```

**Seção B — Seleção do Perfil Base** (visível quando Switch = ON)
```
┌──────────────────────────────────────────────────────────────────┐
│  Perfil de Acesso Base                                           │
│  Selecione o template que melhor descreve a função do usuário.  │
│  Você poderá personalizar as permissões individualmente abaixo. │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ 👑           │ │ 🩺           │ │ 💊           │           │
│  │ Administrador│ │    Médico    │ │  Enfermeiro  │           │
│  │ Acesso total │ │ Prontuário + │ │ Medicação +  │           │
│  │ ao sistema   │ │ Prescrições  │ │  Evolução    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ 🏥           │ │ ⚗️           │ │ 💰           │           │
│  │Recepcionista │ │Farmacêutico  │ │ Faturamento  │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌──────────────┐                             │
│  │ 👁️           │ │ ⚙️           │                             │
│  │Somente Leit. │ │Personalizado │  ← Abre a matriz sem pré-  │
│  └──────────────┘ └──────────────┘    selecionar nenhum valor  │
│                                                                  │
│  ✅ MÉDICO selecionado                                           │
│  "Prescrição, prontuário e solicitação de exames, Evolução médica │
└──────────────────────────────────────────────────────────────────┘
```

Cards clicáveis. O card selecionado fica com borda colorida e fundo suave. Ao clicar, carrega as permissões do template na tabela abaixo.

**Seção C — Matriz de Permissões**

Usar `Ant Design Table` com as seguintes colunas fixas:

| Coluna | Largura | Conteúdo |
|--------|---------|----------|
| Módulo / Funcionalidade | 220px | Nome do módulo + grupo como separador |
| Criar | 80px | `Switch` ou `—` se o módulo não tem essa ação |
| Editar | 80px | `Switch` ou `—` |
| Visualizar | 90px | `Switch` ou `—` |
| Excluir | 80px | `Switch` ou `—` |
| Ações Especiais | 160px | Switches nomeados (Administrar, Solicitar, Liberar, Admitir, Alta, Exportar, Cancelar) |
| Nível de Acesso | 110px | Badge calculado automaticamente |

**Badge "Nível de Acesso"** calculado por módulo:
- 🟢 `Acesso Total` — todas as ações = `true`
- 🟡 `Parcial` — pelo menos 1 ação = `true`
- 🔴 `Sem Acesso` — todas as ações = `false`

**Separadores de grupo** nas rows (usar `children` do Ant Design Table ou row com `colSpan`):
- `📋 ASSISTÊNCIA AO PACIENTE`
- `🏥 ESTRUTURA HOSPITALAR`
- `👥 GESTÃO DE EQUIPE`
- `💰 FINANCEIRO`
- `⚙️ SISTEMA`

Adicionar acima da tabela:
```
[Marcar tudo] [Desmarcar tudo] [Apenas leitura]    Buscar módulo: [_____________]
```

**Seção D — Prévia de Acesso**

Box abaixo da tabela calculado **dinamicamente** a cada alteração nos switches:

```
┌──────────────────────────────────────────────────────────────────┐
│ 📋 Resumo do Perfil Configurado              [Recolher ▲]       │
├─────────────────────────────────┬────────────────────────────────┤
│  ✅ Este usuário PODERÁ:        │  ❌ Este usuário NÃO PODERÁ:  │
│  • Cadastrar e editar pacientes │  • Administrar medicação       │
│  • Criar prescrições médicas    │  • Acessar faturamento         │
│  • Solicitar exames             │  • Gerenciar usuários          │
│  • Admitir e dar alta           │  • Modificar perfis de acesso  │
│  • Ver relatórios               │  • Administrar o sistema       │
└─────────────────────────────────┴────────────────────────────────┘
```

Lógica de geração do texto:
```typescript
// Para cada módulo com pelo menos uma ação = true → adicionar na coluna PODERÁ
// Para cada módulo com todas as ações = false → adicionar na coluna NÃO PODERÁ
// Usar textos humanizados pré-definidos por módulo
const MODULE_DESCRIPTIONS = {
  pacientes:   { pode: 'Cadastrar e editar pacientes',          naoPode: 'Gerenciar cadastro de pacientes' },
  prescricao:  { pode: 'Criar e assinar prescrições médicas',   naoPode: 'Acessar prescrições médicas'     },
  medicacao:   { pode: 'Administrar medicação aos pacientes',   naoPode: 'Administrar medicação'           },
  exames:      { pode: 'Solicitar e liberar exames',            naoPode: 'Acessar módulo de exames'        },
  internacao:  { pode: 'Admitir pacientes e registrar altas',   naoPode: 'Acessar internações'             },
  faturamento: { pode: 'Gerenciar faturamento e convênios',     naoPode: 'Acessar faturamento'             },
  relatorios:  { pode: 'Visualizar e exportar relatórios',      naoPode: 'Acessar relatórios'              },
  usuarios:    { pode: 'Gerenciar usuários do sistema',         naoPode: 'Gerenciar usuários'              },
  sistema:     { pode: 'Administração total do sistema',        naoPode: 'Administrar configurações'       },
};
```

**Seção E — Dados de Login** (ao final da seção de permissões)

```
┌──────────────────────────────────────────────────────────────────┐
│  📧 E-mail de Acesso (Login)                                    │
│  [email@hospital.com________________________________]            │
│  ⚠️ Este será o login do usuário no sistema                      │
│                                                                  │
│  🔑 Senha Inicial                                               │
│  ● Gerar senha aleatória segura (recomendado)                   │
│  ○ Definir senha manualmente                                     │
│                                                                  │
│  ℹ️ O usuário será obrigado a criar uma nova senha               │
│     no primeiro acesso ao sistema.                               │
└──────────────────────────────────────────────────────────────────┘
```

---

### 5. Componente PermissionsDrawer (para edição após criação)

**Criar:** `frontend/src/modules/professionals/components/PermissionsDrawer/index.tsx`

```typescript
interface PermissionsDrawerProps {
  open: boolean;
  onClose: () => void;
  userId: string;      // UUID do User
  roleId: string;      // UUID do Role atual
  userName: string;    // Nome para exibir no título
  onSaved: () => void; // Callback após salvar
}
```

O Drawer (largura 800px) deve:
1. Ao abrir, fazer `GET /roles/:roleId` para carregar permissões atuais
2. Exibir a mesma `PermissionsMatrix` pré-preenchida
3. Botão "Salvar Permissões" → `PATCH /roles/:roleId` com o JSON atualizado
4. Mostrar: `"Última modificação em DD/MM/YYYY às HH:mm"` (campo `updatedAt` do Role)
5. Botão "Restaurar Perfil Original" → abre Modal para selecionar qual template restaurar

---

### 6. Modificações no ProfessionalList

Em `frontend/src/modules/professionals/pages/ProfessionalList/index.tsx`, adicionar:

**Nova coluna "Acesso ao Sistema":**
```typescript
{
  title: 'Acesso ao Sistema',
  key: 'acesso',
  render: (rec: any) => rec.userId
    ? <Tag color="green" icon={<CheckCircleOutlined />}>Ativo</Tag>
    : <Tag color="default">Sem acesso</Tag>
}
```

**Botão extra nas ações:**
```typescript
{
  title: 'Ações',
  render: (rec: any) => (
    <Space>
      <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/professionals/edit/${rec.id}`)} />
      <Button
        size="small"
        icon={<SafetyCertificateOutlined />}
        onClick={() => openPermissionsDrawer(rec)}
        disabled={!rec.userId}
        title={rec.userId ? 'Editar Permissões' : 'Usuário sem acesso ao sistema'}
      />
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(rec.id)} />
    </Space>
  )
}
```

---

### 7. Lógica de Salvamento no Backend

Quando o `ProfessionalForm` for submetido com `criarAcessoSistema = true`:

**Fluxo de criação:**
```
1. POST /roles  → { nome: `${perfilBase}_${timestamp}`, permissoes: {...} }
                  Resposta: { id: 'uuid-do-role-criado' }

2. POST /users  → { roleId: 'uuid-acima', nomeCompleto, cpf, email }
                  O backend cria o user com mustChangePassword: true
                  Resposta: { id: 'uuid-do-user' }

3. PATCH /doctors/:id ou /nurses/:id → { userId: 'uuid-do-user' }
   (vincular o User ao registro de doctor/nurse)
```

**Fluxo de atualização de permissões:**
```
1. PATCH /roles/:roleId → { permissoes: { ...novasPermissoes } }
   (o PermissionsGuard já busca em tempo real — usuário sente efeito imediatamente)
```

---

### 8. Regras de Negócio Obrigatórias

1. **Proteção do ADMIN:** Ao carregar permissões de um Role com nome `ADMIN`, desabilitar todos os switches (somente leitura) e exibir aviso: `"Este perfil é protegido e não pode ser modificado."`

2. **Aviso de substituição:** Ao clicar em um template diferente do atual, exibir `Modal.confirm`: `"Isso substituirá TODAS as permissões configuradas. Deseja continuar?"`

3. **Permissão para acessar:** O botão de permissões e o painel só são visíveis para usuários com `sistema.administrar = true` (usar o hook `usePermission('sistema', 'administrar')` já existente no projeto)

4. **E-mail único:** Antes de submeter, verificar (debounce 500ms) se o e-mail já existe via `GET /users?email=X` — exibir erro inline se já cadastrado

5. **Auditoria automática:** O `AuditInterceptor` já registra todas as chamadas `PATCH /roles/:id` — não é necessário código adicional

---

## ENTREGÁVEIS FINAIS

| # | Arquivo | Ação |
|---|---------|------|
| 1 | `src/shared/constants/permission-templates.constant.ts` | CRIAR |
| 2 | `src/modules/roles/permissions.controller.ts` | CRIAR |
| 3 | `src/modules/roles/roles.module.ts` | MODIFICAR (registrar controller) |
| 4 | `frontend/src/modules/professionals/constants/permissions-definition.ts` | CRIAR |
| 5 | `frontend/src/modules/professionals/components/AccessPermissionsPanel/index.tsx` | CRIAR |
| 6 | `frontend/src/modules/professionals/components/PermissionsMatrix/index.tsx` | CRIAR |
| 7 | `frontend/src/modules/professionals/components/PermissionsPreview/index.tsx` | CRIAR |
| 8 | `frontend/src/modules/professionals/components/PermissionsDrawer/index.tsx` | CRIAR |
| 9 | `frontend/src/modules/professionals/pages/ProfessionalForm/index.tsx` | MODIFICAR |
| 10 | `frontend/src/modules/professionals/pages/ProfessionalList/index.tsx` | MODIFICAR |

**Requisitos de qualidade:**
- Zero erros TypeScript em todos os arquivos novos e modificados
- Compatibilidade total com `PermissionsGuard` existente (não alterar o guard)
- Compatibilidade com Ant Design 5 (sem prop `size` em `Typography.Text`)
- Responsivo: a tabela deve ter scroll horizontal em telas menores que 1024px
- O componente `AccessPermissionsPanel` deve funcionar tanto no modo criação quanto edição do form
