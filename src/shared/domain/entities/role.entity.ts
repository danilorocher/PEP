export interface PermissionFlags {
  criar?: boolean;
  editar?: boolean;
  visualizar?: boolean;
  excluir?: boolean;
  solicitar?: boolean;
  liberar?: boolean;
  admitir?: boolean;
  alta?: boolean;
  administrar?: boolean;
  cancelar?: boolean;
}

export interface RolePermissions {
  [modulo: string]: PermissionFlags;
}

export class Role {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly nome: string,
    public readonly permissoes: RolePermissions,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}