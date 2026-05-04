import api from '../../../shared/services/api';

export const hospitalBillingService = {
  listAccounts: async (status?: string) => {
    return api.get('/hospital-billing/accounts', { params: { status } });
  },

  getAccountDetails: async (id: string) => {
    return api.get(`/hospital-billing/accounts/${id}`);
  },

  recordConsumption: async (data: any) => {
    return api.post('/hospital-billing/accounts/consume', data);
  },

  closeAccount: async (id: string) => {
    return api.patch(`/hospital-billing/accounts/${id}/close`);
  },

  generateSUSBilling: async (id: string, data: any) => {
    return api.post(`/hospital-billing/accounts/${id}/sus-billing`, data);
  },

  registerDenial: async (id: string, data: any) => {
    return api.post(`/hospital-billing/accounts/${id}/denials`, data);
  },

  assignDRG: async (id: string, data: any) => {
    return api.post(`/hospital-billing/accounts/${id}/drg`, data);
  }
};