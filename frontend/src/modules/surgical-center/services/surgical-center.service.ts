import api from '../../../shared/services/api';

export const surgicalCenterService = {
  // =====================================
  // AGENDAMENTO E RECURSOS
  // =====================================
  getResources: async () => {
    return api.get('/surgical-center/resources');
  },

  getSchedules: async (startDate?: string, endDate?: string) => {
    return api.get('/surgical-center/schedules', {
      params: { startDate, endDate }
    });
  },

  scheduleSurgery: async (data: any) => {
    return api.post('/surgical-center/schedules', data);
  },

  // =====================================
  // EXECUÇÃO E PROTOCOLOS DE SEGURANÇA
  // =====================================
  registerPreOpChecklist: async (id: string, data: any) => {
    return api.post(`/surgical-center/schedules/${id}/pre-op-checklist`, data);
  },

  startSurgery: async (id: string) => {
    return api.patch(`/surgical-center/schedules/${id}/start`);
  },

  registerAnesthesia: async (id: string, data: any) => {
    return api.post(`/surgical-center/schedules/${id}/anesthesia`, data);
  },

  registerReport: async (id: string, data: any) => {
    return api.post(`/surgical-center/schedules/${id}/report`, data);
  },

  registerOPME: async (id: string, data: any) => {
    return api.post(`/surgical-center/schedules/${id}/opme`, data);
  },

  registerPostOpChecklist: async (id: string, data: any) => {
    return api.post(`/surgical-center/schedules/${id}/post-op-checklist`, data);
  }
};