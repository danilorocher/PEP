import { Exam } from '../entities/exam.entity';

export interface IExamRepository {
  create(exam: Exam): Promise<Exam>;
  findById(id: string, tenantId: string): Promise<Exam | null>;
  findAll(tenantId: string, skip: number, take: number): Promise<{ data: Exam[]; total: number }>;
  update(exam: Exam): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}

export const EXAM_REPOSITORY_TOKEN = Symbol('IExamRepository');