import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IHospitalizationRepository, HOSPITALIZATION_REPOSITORY_TOKEN } from '../../../domain/repositories/hospitalization.repository.interface';
import { IBedRepository, BED_REPOSITORY_TOKEN } from '../../../domain/repositories/bed.repository.interface';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { Hospitalization } from '../../../domain/entities/hospitalization.entity';
import * as crypto from 'crypto';
import { AdmitPatientDto, DischargePatientDto } from '../../../../modules/hospitalizations/dto/hospitalization.dto';

@Injectable()
export class HospitalizationsUseCases {
  constructor(
    @Inject(HOSPITALIZATION_REPOSITORY_TOKEN) private readonly hospRepo: IHospitalizationRepository,
    @Inject(BED_REPOSITORY_TOKEN) private readonly bedRepo: IBedRepository,
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly recordRepo: IMedicalRecordRepository,
    private readonly prisma: PrismaService
  ) {}

  async admitPatient(tenantId: string, userId: string, data: AdmitPatientDto, ip: string, userAgent: string): Promise<Hospitalization> {
    const bed = await this.bedRepo.findById(data.bedId, tenantId);
    if (!bed) throw new NotFoundException('Leito não encontrado.');
    if (bed.status !== 'LIVRE') throw new BadRequestException('O leito selecionado não está livre.');

    let record = await this.recordRepo.findByPatientId(data.patientId, tenantId);
    
    const created = await this.prisma.$transaction(async (tx) => {
      if (!record) {
        const anoMes = new Date().toISOString().slice(0, 7).replace('-', '');
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const numero = `PR-${anoMes}-${randomNum}`;
        
        const newRecord = await tx.medicalRecord.create({
          data: {
            id: crypto.randomUUID(), tenantId, patientId: data.patientId,
            numero, status: 'ABERTO', responsavelAberturaId: userId
          }
        });
        record = { id: newRecord.id, patientId: newRecord.patientId } as any;
      }

      await tx.bed.update({
        where: { id: data.bedId },
        data: { status: 'OCUPADO' }
      });

      const hosp = await tx.hospitalization.create({
        data: {
          id: crypto.randomUUID(), tenantId, medicalRecordId: record!.id,
          patientId: data.patientId, bedId: data.bedId, wardId: data.wardId,
          medicoResponsavelId: data.medicoResponsavelId, cid10AdmissaoId: data.cid10AdmissaoId,
          convenioId: data.convenioId || null, motivoInternacao: data.motivoInternacao,
          tipoInternacao: data.tipoInternacao as any, tipoAcomodacao: data.tipoAcomodacao as any,
          numeroGuiaInternacao: data.numeroGuiaInternacao || null,
          dataPrevistaAlta: data.dataPrevistaAlta ? new Date(data.dataPrevistaAlta) : null,
          status: 'ATIVA'
        }
      });

      await tx.auditLog.create({
        data: {
          tenantId, userId, acao: 'ADMITIR_PACIENTE', entidade: 'hospitalization',
          entidadeId: hosp.id, ip, userAgent
        }
      });

      return hosp;
    });

    return this.hospRepo.findById(created.id, tenantId) as Promise<Hospitalization>;
  }

  async dischargePatient(tenantId: string, hospitalizationId: string, userId: string, userRole: string, data: DischargePatientDto, ip: string, userAgent: string): Promise<void> {
    if (userRole !== 'MEDICO' && userRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas médicos podem conceder alta hospitalar.');
    }

    const hosp = await this.hospRepo.findById(hospitalizationId, tenantId);
    if (!hosp) throw new NotFoundException('Internação não encontrada.');
    if (hosp.status !== 'ATIVA') throw new BadRequestException('Esta internação não está ativa.');

    await this.prisma.$transaction(async (tx) => {
      const dataAlta = new Date();
      
      await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: {
          status: 'ALTA',
          dataAlta,
          cid10AltaId: data.cid10AltaId,
          sumarioAlta: data.sumarioAlta,
          condicaoPacienteAlta: data.condicaoPacienteAlta as any,
          medicoAltaId: data.medicoAltaId || userId
        }
      });

      await tx.bed.update({
        where: { id: hosp.bedId },
        data: { status: 'LIVRE' }
      });

      await tx.medicalRecord.update({
        where: { id: hosp.medicalRecordId },
        data: { status: 'FECHADO', fechadoEm: dataAlta }
      });

      await tx.auditLog.create({
        data: {
          tenantId, userId, acao: 'DAR_ALTA_PACIENTE', entidade: 'hospitalization',
          entidadeId: hosp.id, ip, userAgent
        }
      });
    });
  }

  async findAll(tenantId: string, page: number, limit: number, filters: any, userId: string, ip: string, userAgent: string) {
    const skip = (page - 1) * limit;
    const result = await this.hospRepo.findAll(tenantId, skip, limit, filters);
    
    await this.prisma.auditLog.create({
      data: {
        tenantId, userId, acao: 'LISTAR_INTERNACOES', entidade: 'hospitalization',
        entidadeId: 'all', ip, userAgent
      }
    });

    return { data: result.data, total: result.total, page, limit };
  }
}