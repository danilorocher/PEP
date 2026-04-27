import { Bed } from '../entities/bed.entity';

export interface IBedRepository {
  create(bed: Bed): Promise<Bed>;
  findAll(tenantId: string, skip: number, take: number): Promise<{ data: Bed[]; total: number }>;
  findById(id: string, tenantId: string): Promise<Bed | null>;
  findAvailable(tenantId: string, tipo?: string, wardId?: string): Promise<Bed[]>;
  update(bed: Bed): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  checkNumeroExists(numero: string, wardId: string, tenantId: string): Promise<boolean>;
}

export const BED_REPOSITORY_TOKEN = Symbol('IBedRepository');