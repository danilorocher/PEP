import { CostCenter } from '../entities/cost-center.entity';

export const COST_CENTER_REPOSITORY_TOKEN = Symbol('ICostCenterRepository');

export interface ICostCenterRepository {
  save(costCenter: CostCenter): Promise<CostCenter>;
  findById(id: string, tenantId: string): Promise<CostCenter | null>;
  findByCode(codigo: string, tenantId: string): Promise<CostCenter | null>;
  findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: CostCenter[]; total: number }>;
  softDelete(id: string, tenantId: string): Promise<void>;
}