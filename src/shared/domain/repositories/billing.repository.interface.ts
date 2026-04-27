import { BillingGuide } from '../entities/billing-guide.entity';
import { BillingItem } from '../entities/billing-item.entity';

export interface IBillingRepository {
  create(guide: BillingGuide, items: BillingItem[]): Promise<BillingGuide>;
  findById(id: string, tenantId: string): Promise<(BillingGuide & { items: BillingItem[] }) | null>;
  findAll(tenantId: string, filters: { 
    convenioId?: string; 
    status?: string; 
    startDate?: Date; 
    endDate?: Date;
    skip: number;
    take: number;
  }): Promise<{ data: BillingGuide[]; total: number }>;
  updateStatus(id: string, tenantId: string, status: string, dataAutorizacao?: Date, codigoAutorizacao?: string): Promise<void>;
  updateItemStatus(itemId: string, status: string, motivoGlosa?: string): Promise<void>;
  delete(id: string, tenantId: string): Promise<void>;
}

export const BILLING_REPOSITORY_TOKEN = Symbol('IBillingRepository');