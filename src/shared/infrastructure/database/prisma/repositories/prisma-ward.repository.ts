import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IWardRepository, OccupancyRate } from '../../../../domain/repositories/ward.repository.interface';
import { Ward } from '../../../../domain/entities/ward.entity';
import { Bed } from '../../../../domain/entities/bed.entity';

@Injectable()
export class PrismaWardRepository implements IWardRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Ward {
    if (!record) return null;
    return new Ward(
      record.id, record.tenantId, record.nome, record.tipo, record.capacidade,
      record.andar, record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  private toBedDomain(record: any): Bed {
    if (!record) return null;
    return new Bed(
      record.id, record.tenantId, record.wardId, record.numero, record.tipo,
      record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(ward: Ward): Promise<Ward> {
    const created = await this.prisma.ward.create({
      data: {
        id: ward.id, tenantId: ward.tenantId, nome: ward.nome, tipo: ward.tipo as any,
        capacidade: ward.capacidade, andar: ward.andar, status: ward.status as any,
      },
    });
    return this.toDomain(created);
  }

  async findAll(tenantId: string, skip: number, take: number): Promise<{ data: Ward[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.ward.findMany({ where: { tenantId, deletedAt: null }, skip, take }),
      this.prisma.ward.count({ where: { tenantId, deletedAt: null } })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async findById(id: string, tenantId: string): Promise<Ward | null> {
    const record = await this.prisma.ward.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return this.toDomain(record);
  }

  async update(ward: Ward): Promise<void> {
    await this.prisma.ward.update({
      where: { id: ward.id },
      data: {
        nome: ward.nome, tipo: ward.tipo as any, capacidade: ward.capacidade,
        andar: ward.andar, status: ward.status as any,
      },
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.ward.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'INATIVO' },
    });
  }

  async getOccupancyRates(tenantId: string): Promise<OccupancyRate[]> {
    const wards = await this.prisma.ward.findMany({
      where: { tenantId, deletedAt: null, status: 'ATIVO' },
      include: {
        _count: { select: { beds: { where: { deletedAt: null } } } },
        beds: { where: { status: 'OCUPADO', deletedAt: null } }
      }
    });

    return wards.map(w => {
      const totalBeds = w._count.beds;
      const occupiedBeds = w.beds.length;
      const tax = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
      
      return {
        wardId: w.id,
        nome: w.nome,
        capacidade: w.capacidade,
        totalLeitosCadastrados: totalBeds,
        leitosOcupados: occupiedBeds,
        taxaOcupacao: `${tax.toFixed(2)}%`
      };
    });
  }

  async findBedsByWard(wardId: string, tenantId: string): Promise<Bed[]> {
    const beds = await this.prisma.bed.findMany({
      where: { wardId, tenantId, deletedAt: null },
      orderBy: { numero: 'asc' }
    });
    return beds.map(this.toBedDomain);
  }
}