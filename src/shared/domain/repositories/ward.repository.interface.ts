import { Ward } from '../entities/ward.entity';
import { Bed } from '../entities/bed.entity';

export interface OccupancyRate {
  wardId: string;
  nome: string;
  capacidade: number;
  totalLeitosCadastrados: number;
  leitosOcupados: number;
  taxaOcupacao: string;
}

export interface IWardRepository {
  create(ward: Ward): Promise<Ward>;
  findAll(tenantId: string, skip: number, take: number): Promise<{ data: Ward[]; total: number }>;
  findById(id: string, tenantId: string): Promise<Ward | null>;
  update(ward: Ward): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  getOccupancyRates(tenantId: string): Promise<OccupancyRate[]>;
  findBedsByWard(wardId: string, tenantId: string): Promise<Bed[]>;
}

export const WARD_REPOSITORY_TOKEN = Symbol('IWardRepository');