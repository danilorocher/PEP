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