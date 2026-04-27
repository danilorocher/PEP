import { Patient } from '../entities/patient.entity';

export interface IPatientRepository {
  createWithMedicalRecord(patient: Patient, medicalRecordNumero: string, cpfHash: string, cnsHash?: string | null): Promise<Patient>;
  findById(id: string, tenantId: string): Promise<Patient | null>;
  findByCpf(cpfHash: string, tenantId: string): Promise<Patient | null>;
  findAll(tenantId: string, skip: number, take: number, filter?: any): Promise<{ data: Patient[]; total: number }>;
  update(patient: Patient, cpfHash?: string, cnsHash?: string | null): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  hasActiveHospitalizations(id: string, tenantId: string): Promise<boolean>;
  getActiveMedicalRecord(patientId: string, tenantId: string): Promise<any>;
  getHospitalizations(patientId: string, tenantId: string): Promise<any[]>;
  
  // Métodos LGPD
  getCompletePatientData(id: string, tenantId: string): Promise<any>;
  anonymize(id: string, tenantId: string, data: Partial<Patient>): Promise<void>;
}

export const PATIENT_REPOSITORY_TOKEN = Symbol('IPatientRepository');