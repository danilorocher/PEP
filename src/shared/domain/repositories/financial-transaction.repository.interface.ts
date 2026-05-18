import { FinancialTransaction } from '../entities/financial-transaction.entity';

export const FINANCIAL_TRANSACTION_REPOSITORY_TOKEN = Symbol('IFinancialTransactionRepository');

export interface IFinancialTransactionRepository {
  save(transaction: FinancialTransaction): Promise<FinancialTransaction>;
  findById(id: string, tenantId: string): Promise<FinancialTransaction | null>;
  findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: FinancialTransaction[]; total: number }>;
  updateStatus(id: string, tenantId: string, status: string, extras?: any): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}