import { SetMetadata } from '@common';

export interface PermissionRequirement {
  module: string; // ex: 'pacientes', 'prontuario'
  action: string; // ex: 'criar', 'editar', 'visualizar'
}

export const REQUIRE_PERMISSIONS_KEY = 'require_permissions';
export const RequirePermissions = (...permissions: PermissionRequirement[]) => 
  SetMetadata(REQUIRE_PERMISSIONS_KEY, permissions);