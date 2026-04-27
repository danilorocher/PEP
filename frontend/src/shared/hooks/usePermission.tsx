import { useAuthStore } from '../../store/useAuthStore';

/**
 * Hook para verificar permissões RBAC
 * Exemplo: const canCreate = usePermission('pacientes', 'criar');
 */
export const usePermission = (module: string, action: string): boolean => {
  const { permissions, user } = useAuthStore();

  // Admin sempre tem permissão total
  if (user?.role === 'ADMIN') return true;

  const modulePermissions = permissions[module];
  if (!modulePermissions) return false;

  return !!modulePermissions[action];
};

/**
 * Componente utilitário para envolver elementos que exigem permissão
 */
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