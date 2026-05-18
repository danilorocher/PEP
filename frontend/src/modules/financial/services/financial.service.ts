import { api } from '../../../shared/services/api';

export const financialService = {
  // --- Centros de Custo ---
  getCostCenters: async (params?: any) => {
    const response = await api.get('/financial/cost-centers', { params });
    return response.data;
  },
  createCostCenter: async (data: any) => {
    const response = await api.post('/financial/cost-centers', data);
    return response.data;
  },
  // 🔥 INJEÇÃO CIRÚRGICA: Função para editar o Centro de Custo
  updateCostCenter: async (id: string, data: any) => {
    const response = await api.patch(`/financial/cost-centers/${id}`, data);
    return response.data;
  },
  deleteCostCenter: async (id: string) => {
    const response = await api.delete(`/financial/cost-centers/${id}`);
    return response.data;
  },

  // --- Plano de Contas ---
  getChartOfAccountsTree: async () => {
    const response = await api.get('/financial/chart-of-accounts/tree');
    return response.data;
  },
  createChartAccount: async (data: any) => {
    const response = await api.post('/financial/chart-of-accounts', data);
    return response.data;
  },

  // --- Lançamentos Financeiros ---
  getTransactions: async (params?: any) => {
    const response = await api.get('/financial/transactions', { params });
    return response.data;
  },
  createTransaction: async (data: any) => {
    const response = await api.post('/financial/transactions', data);
    return response.data;
  },
  approveTransaction: async (id: string) => {
    const response = await api.patch(`/financial/transactions/${id}/approve`);
    return response.data;
  },
  payTransaction: async (id: string, payload: { dataPagamento: string; formaPagamento: string }) => {
    const response = await api.patch(`/financial/transactions/${id}/pay`, payload);
    return response.data;
  },
  cancelTransaction: async (id: string) => {
    const response = await api.patch(`/financial/transactions/${id}/cancel`);
    return response.data;
  }
};