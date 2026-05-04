import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IDoctorRepository } from '../../../../domain/repositories/doctor.repository.interface';
import { Doctor } from '../../../../domain/entities/doctor.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaDoctorRepository implements IDoctorRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Doctor {
    if (!record) return null;
    const specialtyIds = record.specialties?.map((s: any) => s.specialtyId) || [];
    return new Doctor(
      record.id, record.tenantId, record.userId, record.nomeCompleto, record.cpf,
      record.crm, record.ufCrm, record.dataExpedicaoCrm, record.cns,
      record.telefoneProfissional, record.emailProfissional, record.registroSecundario,
      record.assinaturaDigitalPath, record.status, record.createdAt, record.updatedAt, record.deletedAt,
      specialtyIds
    );
  }

  async findById(id: string, tenantId: string): Promise<Doctor | null> {
    const record = await this.prisma.doctor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { specialties: true },
    });
    return this.toDomain(record);
  }

  async findByCpf(cpf: string, tenantId: string): Promise<Doctor | null> {
    const record = await this.prisma.doctor.findFirst({
      where: { cpf, tenantId, deletedAt: null },
      include: { specialties: true },
    });
    return this.toDomain(record);
  }

  async findByCrm(crm: string, ufCrm: string, tenantId: string): Promise<Doctor | null> {
    const record = await this.prisma.doctor.findFirst({
      where: { crm, ufCrm, tenantId, deletedAt: null },
      include: { specialties: true },
    });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: Doctor[]; total: number }> {
    const where: Prisma.DoctorWhereInput = { tenantId, deletedAt: null };
    if (filters?.status) where.status = filters.status as any;
    if (filters?.specialtyId) {
      where.specialties = { some: { specialtyId: filters.specialtyId } };
    }
    if (filters?.search) {
      where.OR = [
        { nomeCompleto: { contains: filters.search, mode: 'insensitive' } },
        { crm: { contains: filters.search } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({ where, skip, take, include: { specialties: true }, orderBy: { nomeCompleto: 'asc' } }),
      this.prisma.doctor.count({ where })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async save(doctor: Doctor): Promise<void> {
    await this.prisma.doctor.create({
      data: {
        id: doctor.id, tenantId: doctor.tenantId, userId: doctor.userId, nomeCompleto: doctor.nomeCompleto,
        cpf: doctor.cpf, crm: doctor.crm, ufCrm: doctor.ufCrm, dataExpedicaoCrm: doctor.dataExpedicaoCrm,
        cns: doctor.cns, telefoneProfissional: doctor.telefoneProfissional, emailProfissional: doctor.emailProfissional,
        registroSecundario: doctor.registroSecundario, assinaturaDigitalPath: doctor.assinaturaDigitalPath,
        status: doctor.status as any,
        specialties: {
          create: doctor.specialties.map(specialtyId => ({ specialtyId }))
        }
      },
    });
  }

  async update(doctor: Doctor): Promise<void> {
    await this.prisma.doctor.update({
      where: { id: doctor.id },
      data: {
        userId: doctor.userId, nomeCompleto: doctor.nomeCompleto, cpf: doctor.cpf,
        crm: doctor.crm, ufCrm: doctor.ufCrm, dataExpedicaoCrm: doctor.dataExpedicaoCrm,
        cns: doctor.cns, telefoneProfissional: doctor.telefoneProfissional, emailProfissional: doctor.emailProfissional,
        registroSecundario: doctor.registroSecundario, assinaturaDigitalPath: doctor.assinaturaDigitalPath,
        status: doctor.status as any,
        specialties: {
          deleteMany: {},
          create: doctor.specialties.map(specialtyId => ({ specialtyId }))
        }
      },
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.doctor.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'INATIVO' },
    });
  }
}