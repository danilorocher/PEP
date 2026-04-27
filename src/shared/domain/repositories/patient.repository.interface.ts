import { Patient } from '../entities/patient.entity';

export interface IPatientRepository {
  createWithMedicalRecord(patient: Patient, medicalRecordNumero: string): Promise<Patient>;
  findById(id: string, tenantId: string): Promise<Patient | null>;
  findByCpf(cpfCriptografado: string, tenantId: string): Promise<Patient | null>;
  findAll(tenantId: string, skip: number, take: number, filter?: any): Promise<{ data: Patient[]; total: number }>;
  update(patient: Patient): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  hasActiveHospitalizations(id: string, tenantId: string): Promise<boolean>;
  getActiveMedicalRecord(patientId: string, tenantId: string): Promise<any>;
  getHospitalizations(patientId: string, tenantId: string): Promise<any[]>;
}

export const PATIENT_REPOSITORY_TOKEN = Symbol('IPatientRepository');