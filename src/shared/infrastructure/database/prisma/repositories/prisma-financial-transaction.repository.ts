import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IFinancialTransactionRepository } from '../../../../domain/repositories/financial-transaction.repository.interface';
import { FinancialTransaction } from '../../../../domain/entities/financial-transaction.entity';

@Injectable()
export class PrismaFinancialTransactionRepository implements IFinancialTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): FinancialTransaction {
    return new FinancialTransaction(
      record.id, record.tenantId, record.tipo, record.natureza,
      record.chartAccountId, record.costCenterId, record.descricao, record.valor,
      record.dataCompetencia, record.dataVencimento, record.dataPagamento,
      record.status, record.origemTipo, record.origemId, record.numeroDocumento,
      record.formaPagamento, record.observacoes, record.criadoPorId,
      record.aprovadoPorId, record.aprovadoEm, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async save(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    const record = await this.prisma.financialTransaction.upsert({
      where: { id: transaction.id },
      create: {
        id: transaction.id, tenantId: transaction.tenantId, tipo: transaction.tipo as any,
        natureza: transaction.natureza as any, chartAccountId: transaction.chartAccountId,
        costCenterId: transaction.costCenterId, descricao: transaction.descricao, valor: transaction.valor,
        dataCompetencia: transaction.dataCompetencia, dataVencimento: transaction.dataVencimento,
        dataPagamento: transaction.dataPagamento, status: transaction.status as any,
        origemTipo: transaction.origemTipo, origemId: transaction.origemId,
        numeroDocumento: transaction.numeroDocumento, formaPagamento: transaction.formaPagamento as any,
        observacoes: transaction.observacoes, criadoPorId: transaction.criadoPorId,
        aprovadoPorId: transaction.aprovadoPorId, aprovadoEm: transaction.aprovadoEm
      },
      update: {
        tipo: transaction.tipo as any, natureza: transaction.natureza as any,
        chartAccountId: transaction.chartAccountId, costCenterId: transaction.costCenterId,
        descricao: transaction.descricao, valor: transaction.valor,
        dataCompetencia: transaction.dataCompetencia, dataVencimento: transaction.dataVencimento,
        dataPagamento: transaction.dataPagamento, status: transaction.status as any,
        numeroDocumento: transaction.numeroDocumento, formaPagamento: transaction.formaPagamento as any,
        observacoes: transaction.observacoes, aprovadoPorId: transaction.aprovadoPorId,
        aprovadoEm: transaction.aprovadoEm
      }
    });
    return this.toDomain(record);
  }

  async findById(id: string, tenantId: string): Promise<FinancialTransaction | null> {
    const record = await this.prisma.financialTransaction.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { chartAccount: true, costCenter: true }
    });
    return record ? this.toDomain(record) : null;
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: FinancialTransaction[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };

    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.status) where.status = filters.status;
    if (filters?.natureza) where.natureza = filters.natureza;
    if (filters?.chartAccountId) where.chartAccountId = filters.chartAccountId;
    if (filters?.costCenterId) where.costCenterId = filters.costCenterId;
    
    if (filters?.dataCompetenciaStart && filters?.dataCompetenciaEnd) {
      where.dataCompetencia = {
        gte: new Date(filters.dataCompetenciaStart),
        lte: new Date(filters.dataCompetenciaEnd)
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.financialTransaction.findMany({ 
        where, skip, take, 
        orderBy: { dataCompetencia: 'desc' },
        include: { chartAccount: true, costCenter: true }
      }),
      this.prisma.financialTransaction.count({ where })
    ]);

    return { data: data.map(r => this.toDomain(r)), total };
  }

  async updateStatus(id: string, tenantId: string, status: string, extras?: any): Promise<void> {
    const data: any = { status: status as any };
    
    if (extras?.aprovadoPorId) data.aprovadoPorId = extras.aprovadoPorId;
    if (extras?.aprovadoEm) data.aprovadoEm = extras.aprovadoEm;
    if (extras?.dataPagamento) data.dataPagamento = extras.dataPagamento;
    if (extras?.formaPagamento) data.formaPagamento = extras.formaPagamento as any;

    await this.prisma.financialTransaction.updateMany({
      where: { id, tenantId },
      data
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.financialTransaction.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'CANCELADO' }
    });
  }
}