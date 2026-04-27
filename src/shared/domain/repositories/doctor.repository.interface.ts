import { Doctor } from '../entities/doctor.entity';

export interface IDoctorRepository {
  findById(id: string, tenantId: string): Promise<Doctor | null>;
  findByCpf(cpfCriptografado: string, tenantId: string): Promise<Doctor | null>;
  findByCrm(crm: string, ufCrm: string, tenantId: string): Promise<Doctor | null>;
  findAll(tenantId: string, skip: number, take: number, specialtyId?: string, status?: string): Promise<{ data: Doctor[]; total: number }>;
  save(doctor: Doctor): Promise<void>;
  update(doctor: Doctor): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}

export const DOCTOR_REPOSITORY_TOKEN = Symbol('IDoctorRepository');