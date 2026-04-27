import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { MedicalRecord } from '../../../domain/entities/medical-record.entity';
import { ClinicalEvolution, ClinicalEvolutionHistory } from '../../../domain/entities/clinical-evolution.entity';
import { EncryptionService } from '../../../infrastructure/database/prisma/repositories/services/encryption.service';
import * as crypto from 'crypto';
import { CreateClinicalEvolutionDto, UpdateClinicalEvolutionDto } from '../../../../modules/medical-records/dto/clinical-evolution.dto';

@Injectable()
export class MedicalRecordsUseCases {
  constructor(
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly recordRepo: IMedicalRecordRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async getById(id: string, tenantId: string, userId: string, ip: string, userAgent: string): Promise<MedicalRecord> {
    const record = await this.recordRepo.findById(id, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');

    await this.recordRepo.logAccess(tenantId, userId, record.patientId, 'VISUALIZAR_PRONTUARIO', ip, userAgent);
    return record;
  }

  async createEvolution(tenantId: string, recordId: string, userId: string, userRole: string, data: CreateClinicalEvolutionDto, ip: string, userAgent: string): Promise<ClinicalEvolution> {
    const record = await this.recordRepo.findById(recordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');
    
    if (record.status === 'FECHADO' || record.status === 'ARQUIVADO') {
      throw new ForbiddenException('Não é possível adicionar evoluções em um prontuário fechado.');
    }

    if (userRole === 'MEDICO' && !data.cid10Id) {
      throw new BadRequestException('O CID-10 é obrigatório para evoluções médicas.');
    }

    const encryptedDesc = this.encryption.encrypt(data.descricao);

    const newEvolution = new ClinicalEvolution(
      crypto.randomUUID(), tenantId, recordId, userId, userRole, encryptedDesc,
      1, data.assinadoDigitalmente || false, data.hospitalizationId || null, data.cid10Id || null,
      data.assinaturaHash || null, new Date(), new Date(), new Date(), null
    );

    const created = await this.recordRepo.createEvolution(newEvolution);

    await this.recordRepo.logAccess(tenantId, userId, record.patientId, 'CRIAR_EVOLUCAO', ip, userAgent);

    return { ...created, descricao: this.encryption.decrypt(created.descricao) };
  }

  async updateEvolution(tenantId: string, evolutionId: string, userId: string, userRole: string, data: UpdateClinicalEvolutionDto, ip: string, userAgent: string): Promise<void> {
    const evolution = await this.recordRepo.findEvolutionById(evolutionId, tenantId);
    if (!evolution) throw new NotFoundException('Evolução não encontrada.');

    const record = await this.recordRepo.findById(evolution.medicalRecordId, tenantId);
    if (record?.status === 'FECHADO') {
       throw new ForbiddenException('Não é possível editar evoluções de um prontuário fechado.');
    }

    if (evolution.profissionalId !== userId) {
      throw new ForbiddenException('Apenas o autor original pode editar esta evolução.');
    }

    if (userRole === 'MEDICO' && !data.cid10Id && !evolution.cid10Id) {
       throw new BadRequestException('O CID-10 é obrigatório para evoluções médicas.');
    }

    const nextVersion = evolution.versao + 1;
    const encryptedDesc = this.encryption.encrypt(data.descricao);

    const updatedEvolution = new ClinicalEvolution(
      evolution.id, evolution.tenantId, evolution.medicalRecordId, evolution.profissionalId,
      evolution.tipoProfissional, encryptedDesc, nextVersion, evolution.assinadoDigitalmente,
      evolution.hospitalizationId, data.cid10Id || evolution.cid10Id, evolution.assinaturaHash,
      evolution.dataHora, evolution.createdAt, new Date(), evolution.deletedAt
    );

    const historyRecord = new ClinicalEvolutionHistory(
      crypto.randomUUID(), evolution.id, nextVersion, updatedEvolution, userId, new Date()
    );

    await this.recordRepo.updateEvolution(updatedEvolution, historyRecord);
    await this.recordRepo.logAccess(tenantId, userId, record!.patientId, 'EDITAR_EVOLUCAO', ip, userAgent);
  }

  async getEvolutions(tenantId: string, recordId: string, page: number, limit: number, userId: string, ip: string, userAgent: string) {
    const record = await this.recordRepo.findById(recordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');

    const skip = (page - 1) * limit;
    const result = await this.recordRepo.findEvolutionsByRecordId(recordId, tenantId, skip, limit);

    await this.recordRepo.logAccess(tenantId, userId, record.patientId, 'LISTAR_EVOLUCOES', ip, userAgent);

    const decryptedData = result.data.map(evo => ({
        ...evo,
        descricao: this.encryption.decrypt(evo.descricao)
    }));

    return { data: decryptedData, total: result.total, page, limit };
  }

  async getEvolutionHistory(tenantId: string, evolutionId: string, userId: string, ip: string, userAgent: string) {
    const evolution = await this.recordRepo.findEvolutionById(evolutionId, tenantId);
    if (!evolution) throw new NotFoundException('Evolução não encontrada.');

    const record = await this.recordRepo.findById(evolution.medicalRecordId, tenantId);
    const history = await this.recordRepo.findEvolutionHistory(evolutionId);

    await this.recordRepo.logAccess(tenantId, userId, record!.patientId, 'VISUALIZAR_HISTORICO_EVOLUCAO', ip, userAgent);

    return history.map(h => ({
        ...h,
        dadosSnapshot: {
            ...h.dadosSnapshot,
            descricao: this.encryption.decrypt(h.dadosSnapshot.descricao)
        }
    }));
  }
}