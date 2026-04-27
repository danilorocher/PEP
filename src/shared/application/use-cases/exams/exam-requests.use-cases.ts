import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IExamRequestRepository, EXAM_REQUEST_REPOSITORY_TOKEN } from '../../../domain/repositories/exam-request.repository.interface';
import { IExamRepository, EXAM_REPOSITORY_TOKEN } from '../../../domain/repositories/exam.repository.interface';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { ExamRequest } from '../../../domain/entities/exam-request.entity';
import * as crypto from 'crypto';
import { CreateExamRequestDto, UpdateExamResultDto } from '../../../../modules/exams/dto/exam-request.dto';

@Injectable()
export class ExamRequestsUseCases {
  constructor(
    @Inject(EXAM_REQUEST_REPOSITORY_TOKEN) private readonly examRequestRepo: IExamRequestRepository,
    @Inject(EXAM_REPOSITORY_TOKEN) private readonly examRepo: IExamRepository,
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly medicalRecordRepo: IMedicalRecordRepository,
  ) {}

  async create(tenantId: string, userId: string, data: CreateExamRequestDto, ip: string, userAgent: string): Promise<ExamRequest> {
    const record = await this.medicalRecordRepo.findById(data.medicalRecordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');
    if (record.status === 'FECHADO' || record.status === 'ARQUIVADO') {
      throw new ForbiddenException('Não é possível solicitar exames em um prontuário fechado.');
    }

    const exam = await this.examRepo.findById(data.examId, tenantId);
    if (!exam) throw new NotFoundException('Exame não encontrado no catálogo.');
    if (!exam.codigoTUSS) throw new BadRequestException('O exame selecionado não possui código TUSS configurado.');

    if (data.isConvenio && !data.cid10Id) {
      throw new BadRequestException('CID-10 é obrigatório para solicitações via convênio.');
    }

    const codigoAutorizacao = data.isConvenio ? `AUTH-${crypto.randomBytes(4).toString('hex').toUpperCase()}` : null;

    const request = new ExamRequest(
      crypto.randomUUID(), tenantId, data.medicalRecordId, data.hospitalizationId || null,
      userId, record.patientId, data.examId, data.cid10Id || null, new Date(),
      data.urgencia, 'SOLICITADO', null, null, data.observacoes || null,
      codigoAutorizacao, new Date(), new Date(), null
    );

    const created = await this.examRequestRepo.create(request);
    await this.medicalRecordRepo.logAccess(tenantId, userId, record.patientId, 'SOLICITAR_EXAME', ip, userAgent);

    return created;
  }

  async findAll(tenantId: string, page: number, limit: number, filters: any, userId: string, ip: string, userAgent: string) {
    const skip = (page - 1) * limit;
    const result = await this.examRequestRepo.findAll(tenantId, skip, limit, filters);

    if (filters?.medicalRecordId) {
      const record = await this.medicalRecordRepo.findById(filters.medicalRecordId, tenantId);
      if (record) await this.medicalRecordRepo.logAccess(tenantId, userId, record.patientId, 'LISTAR_EXAMES', ip, userAgent);
    }

    return { data: result.data, total: result.total, page, limit };
  }

  async updateResult(tenantId: string, requestId: string, userId: string, data: UpdateExamResultDto, ip: string, userAgent: string): Promise<void> {
    const request = await this.examRequestRepo.findById(requestId, tenantId);
    if (!request) throw new NotFoundException('Solicitação de exame não encontrada.');
    if (request.status === 'CONCLUIDO') throw new BadRequestException('O resultado deste exame já foi laudado.');

    const record = await this.medicalRecordRepo.findById(request.medicalRecordId, tenantId);

    await this.examRequestRepo.updateResult(requestId, tenantId, data.resultado, 'CONCLUIDO', new Date());
    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, 'LAUDAR_EXAME', ip, userAgent);
  }
}