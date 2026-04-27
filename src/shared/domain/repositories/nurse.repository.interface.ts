import { Nurse } from '../entities/nurse.entity';

export interface INurseRepository {
  findById(id: string, tenantId: string): Promise<Nurse | null>;
  findByUserId(userId: string, tenantId: string): Promise<Nurse | null>;
  findByCpf(cpfCriptografado: string, tenantId: string): Promise<Nurse | null>;
  findByCoren(coren: string, ufCoren: string, tenantId: string): Promise<Nurse | null>;
  findAll(tenantId: string, skip: number, take: number): Promise<{ data: Nurse[]; total: number }>;
  save(nurse: Nurse): Promise<void>;
  update(nurse: Nurse): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}

export const NURSE_REPOSITORY_TOKEN = Symbol('INurseRepository');