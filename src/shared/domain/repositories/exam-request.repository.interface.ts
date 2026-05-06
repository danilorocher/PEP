import { ExamRequest } from '../entities/exam-request.entity';

export interface IExamRequestRepository {
  create(request: ExamRequest): Promise<ExamRequest>;
  findById(id: string, tenantId: string): Promise<ExamRequest | null>;
  findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: ExamRequest[]; total: number }>;
  updateResult(id: string, tenantId: string, resultado: string, status: string, dataHora: Date): Promise<void>;
  
  // 🔥 NOVO: Assinatura para atualizar o status diretamente da tabela
  updateStatus(id: string, tenantId: string, status: string): Promise<void>; 
}

export const EXAM_REQUEST_REPOSITORY_TOKEN = Symbol('IExamRequestRepository');