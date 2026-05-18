import { ChartOfAccounts } from '../entities/chart-of-accounts.entity';

export const CHART_OF_ACCOUNTS_REPOSITORY_TOKEN = Symbol('IChartOfAccountsRepository');

export interface IChartOfAccountsRepository {
  save(account: ChartOfAccounts): Promise<ChartOfAccounts>;
  findById(id: string, tenantId: string): Promise<ChartOfAccounts | null>;
  findByCode(codigo: string, tenantId: string): Promise<ChartOfAccounts | null>;
  findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: ChartOfAccounts[]; total: number }>;
  softDelete(id: string, tenantId: string): Promise<void>;
}