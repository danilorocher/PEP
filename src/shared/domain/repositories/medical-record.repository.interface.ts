import { MedicalRecord } from '../entities/medical-record.entity';
import { ClinicalEvolution, ClinicalEvolutionHistory } from '../entities/clinical-evolution.entity';

export interface IMedicalRecordRepository {
  findById(id: string, tenantId: string): Promise<MedicalRecord | null>;
  findByPatientId(patientId: string, tenantId: string): Promise<MedicalRecord | null>;
  updateStatus(id: string, tenantId: string, status: string, fechadoEm?: Date): Promise<void>;
  
  createEvolution(evolution: ClinicalEvolution): Promise<ClinicalEvolution>;
  updateEvolution(evolution: ClinicalEvolution, history: ClinicalEvolutionHistory): Promise<void>;
  findEvolutionById(id: string, tenantId: string): Promise<ClinicalEvolution | null>;
  findEvolutionsByRecordId(recordId: string, tenantId: string, skip: number, take: number): Promise<{ data: ClinicalEvolution[]; total: number }>;
  findEvolutionHistory(evolutionId: string): Promise<ClinicalEvolutionHistory[]>;
  
  logAccess(tenantId: string, userId: string, patientId: string, action: string, ip: string, userAgent: string): Promise<void>;
}

export const MEDICAL_RECORD_REPOSITORY_TOKEN = Symbol('IMedicalRecordRepository');