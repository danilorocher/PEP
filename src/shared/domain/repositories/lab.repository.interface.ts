import { LabOrder, LabSample, LabResult, LabReport, LabExam } from '@prisma/client';

export interface ILabRepository {
  // Catálogo
  createExam(data: any): Promise<LabExam>;
  findExamByCode(tenantId: string, code: string): Promise<LabExam | null>;
  
  // Pedidos e Amostras
  createOrder(data: any, examIds: string[]): Promise<LabOrder>;
  findOrderById(id: string, tenantId: string): Promise<any>;
  updateOrderStatus(id: string, status: any): Promise<void>;
  createSample(data: any): Promise<LabSample>;
  
  // Resultados e Laudos
  updateResult(id: string, data: any): Promise<LabResult>;
  upsertReport(data: any): Promise<LabReport>;
}

export const LAB_REPOSITORY_TOKEN = Symbol('ILabRepository');