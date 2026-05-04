// 🔥 CORREÇÃO: 3 níveis de recuo para chegar em src/ e acessar shared/services/api
import api from '../../../shared/services/api';

export const labService = {
  getOrders: async (params?: any) => api.get('/lab/orders', { params }),
  getOrderDetails: async (id: string) => api.get(`/lab/orders/${id}`),
  createOrder: async (data: any) => api.post('/lab/orders', data),
  collectSample: async (orderId: string, data: { sampleType: string }) => 
    api.post(`/lab/orders/${orderId}/collect`, data),
  releaseResult: async (resultId: string, data: { value: string }) => 
    api.post(`/lab/results/${resultId}/release`, data),
  signReport: async (orderId: string, data: { reportText: string }) => 
    api.post(`/lab/orders/${orderId}/sign`, data),
};