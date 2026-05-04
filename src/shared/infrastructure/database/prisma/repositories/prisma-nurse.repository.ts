import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { INurseRepository } from '../../../../domain/repositories/nurse.repository.interface';
import { Nurse } from '../../../../domain/entities/nurse.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaNurseRepository implements INurseRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Nurse | null {
    if (!record) return null;
    return new Nurse(
      record.id, record.tenantId, record.userId, record.nomeCompleto, record.cpf,
      record.coren, record.ufCoren, record.dataExpedicaoCoren, record.categoria,
      record.cns, record.podePrescrever, record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async findById(id: string, tenantId: string): Promise<Nurse | null> {
    const record = await this.prisma.nurse.findFirst({ where: { id, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findByUserId(userId: string, tenantId: string): Promise<Nurse | null> {
    const record = await this.prisma.nurse.findFirst({ where: { userId, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findByCpf(cpf: string, tenantId: string): Promise<Nurse | null> {
    const record = await this.prisma.nurse.findFirst({ where: { cpf, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findByCoren(coren: string, ufCoren: string, tenantId: string): Promise<Nurse | null> {
    const record = await this.prisma.nurse.findFirst({ where: { coren, ufCoren, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: Nurse[]; total: number }> {
    const where: Prisma.NurseWhereInput = { tenantId, deletedAt: null };
    if (filters?.status) where.status = filters.status as any;
    if (filters?.categoria) where.categoria = filters.categoria as any;
    if (filters?.podePrescrever !== undefined) where.podePrescrever = filters.podePrescrever;
    if (filters?.search) {
      where.OR = [
        { nomeCompleto: { contains: filters.search, mode: 'insensitive' } },
        { coren: { contains: filters.search } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.nurse.findMany({ where, skip, take, orderBy: { nomeCompleto: 'asc' } }),
      this.prisma.nurse.count({ where })
    ]);
    return { data: data.map(r => this.toDomain(r)!), total };
  }

  async save(nurse: Nurse): Promise<void> {
    await this.prisma.nurse.create({
      data: {
        id: nurse.id, tenantId: nurse.tenantId, userId: nurse.userId, nomeCompleto: nurse.nomeCompleto,
        cpf: nurse.cpf, coren: nurse.coren, ufCoren: nurse.ufCoren, dataExpedicaoCoren: nurse.dataExpedicaoCoren,
        categoria: nurse.categoria as any, cns: nurse.cns, podePrescrever: nurse.podePrescrever,
        status: nurse.status as any,
      },
    });
  }

  async update(nurse: Nurse): Promise<void> {
    await this.prisma.nurse.update({
      where: { id: nurse.id },
      data: {
        userId: nurse.userId, nomeCompleto: nurse.nomeCompleto, cpf: nurse.cpf,
        coren: nurse.coren, ufCoren: nurse.ufCoren, dataExpedicaoCoren: nurse.dataExpedicaoCoren,
        categoria: nurse.categoria as any, cns: nurse.cns, podePrescrever: nurse.podePrescrever,
        status: nurse.status as any,
      },
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.nurse.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'INATIVO' },
    });
  }
}