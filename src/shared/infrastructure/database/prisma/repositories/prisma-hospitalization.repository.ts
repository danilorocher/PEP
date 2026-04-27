import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IHospitalizationRepository } from '../../../../domain/repositories/hospitalization.repository.interface';
import { Hospitalization } from '../../../../domain/entities/hospitalization.entity';

@Injectable()
export class PrismaHospitalizationRepository implements IHospitalizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Hospitalization {
    if (!record) return null;
    return new Hospitalization(
      record.id, record.tenantId, record.medicalRecordId, record.patientId,
      record.bedId, record.wardId, record.medicoResponsavelId, record.cid10AdmissaoId,
      record.cid10AltaId, record.convenioId, record.medicoAltaId, record.dataEntrada,
      record.dataPrevistaAlta, record.dataAlta, record.motivoInternacao, record.tipoInternacao,
      record.tipoAcomodacao, record.numeroGuiaInternacao, record.sumarioAlta,
      record.condicaoPacienteAlta, record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(hospitalization: Hospitalization): Promise<Hospitalization> {
    const created = await this.prisma.hospitalization.create({
      data: {
        id: hospitalization.id, tenantId: hospitalization.tenantId,
        medicalRecordId: hospitalization.medicalRecordId, patientId: hospitalization.patientId,
        bedId: hospitalization.bedId, wardId: hospitalization.wardId,
        medicoResponsavelId: hospitalization.medicoResponsavelId,
        cid10AdmissaoId: hospitalization.cid10AdmissaoId, cid10AltaId: hospitalization.cid10AltaId,
        convenioId: hospitalization.convenioId, medicoAltaId: hospitalization.medicoAltaId,
        dataEntrada: hospitalization.dataEntrada, dataPrevistaAlta: hospitalization.dataPrevistaAlta,
        dataAlta: hospitalization.dataAlta, motivoInternacao: hospitalization.motivoInternacao,
        tipoInternacao: hospitalization.tipoInternacao as any,
        tipoAcomodacao: hospitalization.tipoAcomodacao as any,
        numeroGuiaInternacao: hospitalization.numeroGuiaInternacao,
        sumarioAlta: hospitalization.sumarioAlta, condicaoPacienteAlta: hospitalization.condicaoPacienteAlta as any,
        status: hospitalization.status as any
      }
    });
    return this.toDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<Hospitalization | null> {
    const record = await this.prisma.hospitalization.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: Hospitalization[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.hospitalization.findMany({ where, skip, take, orderBy: { dataEntrada: 'desc' } }),
      this.prisma.hospitalization.count({ where })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async update(hospitalization: Hospitalization): Promise<void> {
    await this.prisma.hospitalization.update({
      where: { id: hospitalization.id },
      data: {
        bedId: hospitalization.bedId, wardId: hospitalization.wardId,
        medicoResponsavelId: hospitalization.medicoResponsavelId,
        cid10AdmissaoId: hospitalization.cid10AdmissaoId, cid10AltaId: hospitalization.cid10AltaId,
        convenioId: hospitalization.convenioId, medicoAltaId: hospitalization.medicoAltaId,
        dataEntrada: hospitalization.dataEntrada, dataPrevistaAlta: hospitalization.dataPrevistaAlta,
        dataAlta: hospitalization.dataAlta, motivoInternacao: hospitalization.motivoInternacao,
        tipoInternacao: hospitalization.tipoInternacao as any,
        tipoAcomodacao: hospitalization.tipoAcomodacao as any,
        numeroGuiaInternacao: hospitalization.numeroGuiaInternacao,
        sumarioAlta: hospitalization.sumarioAlta, condicaoPacienteAlta: hospitalization.condicaoPacienteAlta as any,
        status: hospitalization.status as any
      }
    });
  }
}