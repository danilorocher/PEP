import { Hospitalization } from '../entities/hospitalization.entity';

export interface IHospitalizationRepository {
  create(hospitalization: Hospitalization): Promise<Hospitalization>;
  findById(id: string, tenantId: string): Promise<Hospitalization | null>;
  findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: Hospitalization[]; total: number }>;
  update(hospitalization: Hospitalization): Promise<void>;
}

export const HOSPITALIZATION_REPOSITORY_TOKEN = Symbol('IHospitalizationRepository');