import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IChartOfAccountsRepository } from '../../../../domain/repositories/chart-of-accounts.repository.interface';
import { ChartOfAccounts } from '../../../../domain/entities/chart-of-accounts.entity';

@Injectable()
export class PrismaChartOfAccountsRepository implements IChartOfAccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): ChartOfAccounts {
    return new ChartOfAccounts(
      record.id, record.tenantId, record.codigo, record.nome,
      record.tipo, record.natureza, record.codigoPai, record.aceitaLancamento,
      record.ativo, record.descricao, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async save(account: ChartOfAccounts): Promise<ChartOfAccounts> {
    const record = await this.prisma.chartOfAccounts.upsert({
      where: { id: account.id },
      create: {
        id: account.id, tenantId: account.tenantId, codigo: account.codigo,
        nome: account.nome, tipo: account.tipo as any, natureza: account.natureza as any,
        codigoPai: account.codigoPai, aceitaLancamento: account.aceitaLancamento,
        ativo: account.ativo, descricao: account.descricao
      },
      update: {
        codigo: account.codigo, nome: account.nome, tipo: account.tipo as any,
        natureza: account.natureza as any, codigoPai: account.codigoPai,
        aceitaLancamento: account.aceitaLancamento, ativo: account.ativo, descricao: account.descricao
      }
    });
    return this.toDomain(record);
  }

  async findById(id: string, tenantId: string): Promise<ChartOfAccounts | null> {
    const record = await this.prisma.chartOfAccounts.findFirst({ where: { id, tenantId, deletedAt: null } });
    return record ? this.toDomain(record) : null;
  }

  async findByCode(codigo: string, tenantId: string): Promise<ChartOfAccounts | null> {
    const record = await this.prisma.chartOfAccounts.findFirst({ where: { codigo, tenantId, deletedAt: null } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: ChartOfAccounts[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };
    
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.aceitaLancamento !== undefined) where.aceitaLancamento = filters.aceitaLancamento;

    const [data, total] = await Promise.all([
      this.prisma.chartOfAccounts.findMany({ where, skip, take, orderBy: { codigo: 'asc' } }),
      this.prisma.chartOfAccounts.count({ where })
    ]);

    return { data: data.map(r => this.toDomain(r)), total };
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.chartOfAccounts.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), ativo: false }
    });
  }
}