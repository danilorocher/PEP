import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';

// 🔥 A MÁGICA: Deteta automaticamente se está em localhost ou num IP da rede!
const currentHost = window.location.hostname;
const apiURL = import.meta.env.VITE_API_URL || `http://${currentHost}:3000`;

// 🔥 ALTERAÇÃO AQUI: Adicionado o "export" antes da constante para suportar importação com { api }
export const api = axios.create({
  baseURL: apiURL,
});

// Interceptor para injetar o Tenant e o Token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();

  const unitStorage = localStorage.getItem('@PEP:unit');
  if (unitStorage) {
    try {
      const unit = JSON.parse(unitStorage);
      if (unit && unit.subdomain) {
        config.headers['x-tenant-subdomain'] = unit.subdomain;
      }
    } catch (e) {
      console.error('Erro ao ler a unidade', e);
    }
  }
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// Interceptor para tratar erro 401 e Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🔥 A CORREÇÃO DE OURO: Não interceptar rotas de login ou refresh
    // Se o erro for no login, devolve para a tela mostrar a mensagem vermelha!
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`, 
          {}, 
          { withCredentials: true }
        );

        useAuthStore.getState().setAuth(data.user, data.accessToken, data.permissions);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Mantido o export padrão para garantir a integridade do resto do sistema
export default api;