import { useAuthStore } from '../../store/useAuthStore';

/**
 * Hook para verificar permissões RBAC
 * Exemplo: const canCreate = usePermission('pacientes', 'criar');
 */
export const usePermission = (module: string, action: string): boolean => {
  const { permissions, user } = useAuthStore();

  // 1. Admin sempre tem permissão total (Cobre as várias formas que o backend pode enviar a role)
  const isAdmin = user?.roleName === 'ADMIN' || user?.role === 'ADMIN' || user?.role?.nome === 'ADMIN';
  if (isAdmin) return true;

  // 2. Busca as permissões de forma segura (da store ou de dentro do perfil do usuário)
  const safePermissions = permissions || user?.role?.permissoes || user?.permissoes || {};

  // 3. Pega as permissões do módulo solicitado
  const modulePermissions = safePermissions[module];
  
  // Se o módulo não existir nas permissões, bloqueia
  if (!modulePermissions) return false;

  // 4. Retorna verdadeiro se a ação (criar, visualizar, etc) estiver como true
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