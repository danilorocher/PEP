import api from '../../../shared/services/api';

export const assistanceService = {
  // Sinais Vitais
  createVitalSigns: (data: any) => api.post('/assistance/vital-signs', data),
  getVitalSignsByPatient: (patientId: string, page = 1) => 
    api.get(`/assistance/vital-signs/patient/${patientId}`, { params: { page } }),

  // Balanço Hídrico
  openFluidBalance: (data: any) => api.post('/assistance/fluid-balance', data),
  addFluidEntry: (balanceId: string, data: any) => api.post(`/assistance/fluid-balance/${balanceId}/entry`, data),
  addFluidOutput: (balanceId: string, data: any) => api.post(`/assistance/fluid-balance/${balanceId}/output`, data),
  getBalancesByPatient: (patientId: string) => api.get(`/assistance/fluid-balance/patient/${patientId}`),

  // Escalas de Risco
  createBraden: (data: any) => api.post('/assistance/risk/braden', data),
  createMorse: (data: any) => api.post('/assistance/risk/morse', data),
  createGlasgow: (data: any) => api.post('/assistance/risk/glasgow', data),
};