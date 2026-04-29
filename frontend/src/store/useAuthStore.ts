import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PermissionsMap = Record<string, Record<string, boolean>>;

interface UserRole {
  id?: string;
  nome?: string;
  permissoes?: PermissionsMap;
}

export interface User {
  id: string;
  name?: string;
  nomeCompleto?: string;
  email?: string;
  role?: string | UserRole;
  roleName?: string;
  mustChangePassword?: boolean;
  permissoes?: PermissionsMap;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: PermissionsMap;
  setAuth: (user: User, token: string, permissions: PermissionsMap | any) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      permissions: {},
      setAuth: (user, token, permissions) => set({
        user,
        accessToken: token,
        permissions: permissions || {},
      }),
      logout: () => set({ user: null, accessToken: null, permissions: {} }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: '@pep-plus/auth' }
  )
);
