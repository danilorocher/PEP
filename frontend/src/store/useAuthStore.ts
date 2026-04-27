import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  role: string;
  mustChangePassword: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: Record<string, Record<string, boolean>>;
  setAuth: (user: User, token: string, permissions: any) => void;
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
        permissions 
      }),
      logout: () => set({ user: null, accessToken: null, permissions: {} }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: '@pep-plus/auth' }
  )
);