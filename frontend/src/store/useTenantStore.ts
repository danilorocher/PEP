import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  subdomain: string;
  tenantId: string | null;
  setTenant: (subdomain: string, id: string | null) => void;
  getHostname: () => string;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      subdomain: window.location.hostname.split('.')[0] || '',
      tenantId: null,
      setTenant: (subdomain, id) => set({ subdomain, tenantId: id }),
      getHostname: () => {
        const { subdomain } = get();
        // Em produção, usa o domínio real. Em dev, usa localhost com porta
        return import.meta.env.DEV 
          ? `${subdomain}.localhost:3000` 
          : `${subdomain}.pep-plus.com`;
      }
    }),
    { name: '@pep-plus/tenant' }
  )
);