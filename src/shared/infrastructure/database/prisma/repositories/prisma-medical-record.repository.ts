import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IMedicalRecordRepository } from '../../../../domain/repositories/medical-record.repository.interface';
import { MedicalRecord } from '../../../../domain/entities/medical-record.entity';
import { ClinicalEvolution, ClinicalEvolutionHistory } from '../../../../domain/entities/clinical-evolution.entity';

@Injectable()
export class PrismaMedicalRecordRepository implements IMedicalRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): MedicalRecord | null {
    if (!record) return null;
    return new MedicalRecord(
      record.id, record.tenantId, record.patientId, record.numero, record.status,
      record.responsavelAberturaId, record.abertoEm, record.fechadoEm,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  private toEvolutionDomain(record: any): ClinicalEvolution | null {
    if (!record) return null;
    return new ClinicalEvolution(
      record.id, record.tenantId, record.medicalRecordId, record.profissionalId,
      record.tipoProfissional, record.descricao, record.versao, record.assinadoDigitalmente,
      record.hospitalizationId, record.cid10Id, record.assinaturaHash,
      record.dataHora, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  private toHistoryDomain(record: any): ClinicalEvolutionHistory | null {
    if (!record) return null;
    return new ClinicalEvolutionHistory(
      record.id, record.evolutionId, record.versao, record.dadosSnapshot,
      record.alteradoPor, record.createdAt
    );
  }

  async findById(id: string, tenantId: string): Promise<MedicalRecord | null> {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    return this.toDomain(record);
  }

  async findByPatientId(patientId: string, tenantId: string): Promise<MedicalRecord | null> {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { patientId, tenantId, status: 'ABERTO', deletedAt: null }
    });
    return this.toDomain(record);
  }

  async updateStatus(id: string, tenantId: string, status: string, fechadoEm?: Date): Promise<void> {
    await this.prisma.medicalRecord.update({
      where: { id, tenantId },
      data: { status: status as any, fechadoEm }
    });
  }

  async createEvolution(evolution: ClinicalEvolution): Promise<ClinicalEvolution> {
    const created = await this.prisma.$transaction(async (tx) => {
      const evo = await tx.clinicalEvolution.create({
        data: {
          id: evolution.id,
          tenantId: evolution.tenantId,
          medicalRecordId: evolution.medicalRecordId,
          profissionalId: evolution.profissionalId,
          tipoProfissional: evolution.tipoProfissional as any,
          descricao: evolution.descricao,
          versao: evolution.versao,
          assinadoDigitalmente: evolution.assinadoDigitalmente,
          hospitalizationId: evolution.hospitalizationId,
          cid10Id: evolution.cid10Id,
          assinaturaHash: evolution.assinaturaHash,
          dataHora: evolution.dataHora
        }
      });

      await tx.clinicalEvolutionHistory.create({
        data: {
          evolutionId: evo.id,
          versao: evo.versao,
          dadosSnapshot: evo as any,
          alteradoPor: evolution.profissionalId
        }
      });

      return evo;
    });

    return this.toEvolutionDomain(created)!;
  }

  async updateEvolution(evolution: ClinicalEvolution, history: ClinicalEvolutionHistory): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.clinicalEvolution.update({
        where: { id: evolution.id },
        data: {
          descricao: evolution.descricao,
          versao: evolution.versao,
          cid10Id: evolution.cid10Id
        }
      });

      await tx.clinicalEvolutionHistory.create({
        data: {
          id: history.id,
          evolutionId: history.evolutionId,
          versao: history.versao,
          dadosSnapshot: history.dadosSnapshot,
          alteradoPor: history.alteradoPor
        }
      });
    });
  }

  async findEvolutionById(id: string, tenantId: string): Promise<ClinicalEvolution | null> {
    const record = await this.prisma.clinicalEvolution.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    return this.toEvolutionDomain(record);
  }

  async findEvolutionsByRecordId(recordId: string, tenantId: string, skip: number, take: number): Promise<{ data: ClinicalEvolution[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.clinicalEvolution.findMany({
        where: { medicalRecordId: recordId, tenantId, deletedAt: null },
        skip,
        take,
        orderBy: { dataHora: 'desc' }
      }),
      this.prisma.clinicalEvolution.count({
        where: { medicalRecordId: recordId, tenantId, deletedAt: null }
      })
    ]);
    return { data: data.map(r => this.toEvolutionDomain(r)!), total };
  }

  async findEvolutionHistory(evolutionId: string): Promise<ClinicalEvolutionHistory[]> {
    const records = await this.prisma.clinicalEvolutionHistory.findMany({
      where: { evolutionId },
      orderBy: { versao: 'desc' }
    });
    return records.map(r => this.toHistoryDomain(r)!);
  }

  async logAccess(tenantId: string, userId: string, patientId: string, action: string, ip: string, userAgent: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        acao: action,
        entidade: 'medical-record',
        entidadeId: patientId,
        ip,
        userAgent
      }
    });
  }

  /**
   * Implementação de Soft Delete Mandatório para Prontuários (LGPD + CFM)
   */
  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.medicalRecord.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() }
    });
  }

  /**
   * Bloqueio de Hard Delete (Segurança de Dados)
   */
  async permanentDelete(id: string, tenantId: string): Promise<void> {
    throw new ForbiddenException('Exclusão permanente de prontuários é proibida por norma legal (CFM/LGPD).');
  }
}