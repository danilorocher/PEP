import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ICostCenterRepository } from '../../../../domain/repositories/cost-center.repository.interface';
import { CostCenter } from '../../../../domain/entities/cost-center.entity';

@Injectable()
export class PrismaCostCenterRepository implements ICostCenterRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): CostCenter {
    return new CostCenter(
      record.id, record.tenantId, record.codigo, record.nome,
      record.tipo, record.codigoPai, record.ativo, record.descricao,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async save(costCenter: CostCenter): Promise<CostCenter> {
    const record = await this.prisma.costCenter.upsert({
      where: { id: costCenter.id },
      create: {
        id: costCenter.id, tenantId: costCenter.tenantId, codigo: costCenter.codigo,
        nome: costCenter.nome, tipo: costCenter.tipo as any, codigoPai: costCenter.codigoPai,
        ativo: costCenter.ativo, descricao: costCenter.descricao
      },
      update: {
        codigo: costCenter.codigo, nome: costCenter.nome, tipo: costCenter.tipo as any,
        codigoPai: costCenter.codigoPai, ativo: costCenter.ativo, descricao: costCenter.descricao
      }
    });
    return this.toDomain(record);
  }

  async findById(id: string, tenantId: string): Promise<CostCenter | null> {
    const record = await this.prisma.costCenter.findFirst({ where: { id, tenantId, deletedAt: null } });
    return record ? this.toDomain(record) : null;
  }

  async findByCode(codigo: string, tenantId: string): Promise<CostCenter | null> {
    const record = await this.prisma.costCenter.findFirst({ where: { codigo, tenantId, deletedAt: null } });
    return record ? this.toDomain(record) : null;
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: CostCenter[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };
    
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.ativo !== undefined) where.ativo = filters.ativo;
    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { codigo: { contains: filters.search } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.costCenter.findMany({ where, skip, take, orderBy: { codigo: 'asc' } }),
      this.prisma.costCenter.count({ where })
    ]);

    return { data: data.map(r => this.toDomain(r)), total };
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.costCenter.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), ativo: false }
    });
  }
}