import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IBedRepository } from '../../../../domain/repositories/bed.repository.interface';
import { Bed } from '../../../../domain/entities/bed.entity';

@Injectable()
export class PrismaBedRepository implements IBedRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Bed {
    return new Bed(
      record.id, record.tenantId, record.wardId, record.numero, record.tipo,
      record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(bed: Bed): Promise<Bed> {
    const created = await this.prisma.bed.create({
      data: {
        id: bed.id, tenantId: bed.tenantId, wardId: bed.wardId,
        numero: bed.numero, tipo: bed.tipo as any, status: bed.status as any,
      },
    });
    return this.toDomain(created);
  }

  async findAll(tenantId: string, skip: number, take: number): Promise<{ data: Bed[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.bed.findMany({ where: { tenantId, deletedAt: null }, skip, take }),
      this.prisma.bed.count({ where: { tenantId, deletedAt: null } })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<Bed | null> {
    const record = await this.prisma.bed.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return record ? this.toDomain(record) : null;
  }

  async findAvailable(tenantId: string, tipo?: string, wardId?: string): Promise<Bed[]> {
    const where: any = { tenantId, status: 'LIVRE', deletedAt: null };
    if (tipo) where.tipo = tipo;
    if (wardId) where.wardId = wardId;

    const records = await this.prisma.bed.findMany({ where, orderBy: { numero: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  async update(bed: Bed): Promise<void> {
    await this.prisma.bed.update({
      where: { id: bed.id },
      data: {
        wardId: bed.wardId, numero: bed.numero,
        tipo: bed.tipo as any, status: bed.status as any,
      },
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.bed.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'MANUTENCAO' },
    });
  }

  async checkNumeroExists(numero: string, wardId: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.bed.count({
      where: { numero, wardId, tenantId, deletedAt: null },
    });
    return count > 0;
  }
}