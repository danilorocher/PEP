import React from 'react';
import { useAuthStore, User } from '../../store/useAuthStore';

type PermissionsMap = Record<string, Record<string, boolean>>;

function getRoleName(user: User | null): string {
  if (!user) return '';
  if (user.roleName) return user.roleName;
  if (typeof user.role === 'string') return user.role;
  if (typeof user.role === 'object' && user.role?.nome) return user.role.nome;
  return '';
}

function getPermissions(user: User | null, storePermissions: PermissionsMap): PermissionsMap {
  if (storePermissions && Object.keys(storePermissions).length > 0) return storePermissions;
  if (user?.permissoes) return user.permissoes;
  if (typeof user?.role === 'object' && user.role?.permissoes) return user.role.permissoes;
  return {};
}

export const usePermission = (module: string, action: string): boolean => {
  const { permissions, user } = useAuthStore();
  if (getRoleName(user) === 'ADMIN') return true;
  const safePermissions = getPermissions(user, permissions);
  const modulePermissions = safePermissions[module];
  if (!modulePermissions) return false;
  return !!modulePermissions[action];
};

interface CanProps {
  module: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ module, action, children, fallback = null }) => {
  const hasPermission = usePermission(module, action);
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};
