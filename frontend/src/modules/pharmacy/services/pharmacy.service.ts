import api from '../../../shared/services/api';

export const pharmacyService = {
  addStock: async (data: any) => {
    return api.post('/pharmacy/stock', data);
  },
  
  getStockByMedication: async (medicationId: string) => {
    return api.get(`/pharmacy/stock/${medicationId}`);
  },

  getPendingDispensations: async () => {
    return api.get('/pharmacy/dispensations/pending');
  },

  dispenseMedications: async (data: any) => {
    return api.post('/pharmacy/dispense', data);
  },

  addInteractionRule: async (data: any) => {
    return api.post('/pharmacy/interactions/rules', data);
  },

  checkInteractions: async (medicationIds: string[]) => {
    return api.post('/pharmacy/interactions/check', { medicationIds });
  },
  
  // 🔥 ROTA CORRIGIDA: Aponta para o catálogo do nosso Módulo de Farmácia
  getAllMedications: async () => {
    return api.get('/pharmacy/medications/catalog');
  }
};