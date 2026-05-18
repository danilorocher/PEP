import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IExamRequestRepository, EXAM_REQUEST_REPOSITORY_TOKEN } from '../../../domain/repositories/exam-request.repository.interface';
import { IExamRepository, EXAM_REPOSITORY_TOKEN } from '../../../domain/repositories/exam.repository.interface';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { ExamRequest } from '../../../domain/entities/exam-request.entity';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import * as crypto from 'crypto';
import { CreateExamRequestDto } from '../../../../modules/exams/dto/exam-request.dto';
import { QueryExamRequestsDto } from '../../../../modules/exams/dto/query-exam-requests.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class ExamRequestsUseCases {
  constructor(
    @Inject(EXAM_REQUEST_REPOSITORY_TOKEN) private readonly examRequestRepo: IExamRequestRepository,
    @Inject(EXAM_REPOSITORY_TOKEN) private readonly examRepo: IExamRepository,
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly medicalRecordRepo: IMedicalRecordRepository,
    private readonly prisma: PrismaService, // 🔥 INJETADO: Acesso ao banco para buscar a identidade médica
  ) {}

  async create(tenantId: string, userId: string, data: CreateExamRequestDto, ip: string, userAgent: string): Promise<ExamRequest> {
    const record = await this.medicalRecordRepo.findById(data.medicalRecordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');
    if (record.status === 'FECHADO' || record.status === 'ARQUIVADO') throw new ForbiddenException('Prontuário fechado.');

    const exam = await this.examRepo.findById(data.examId, tenantId);
    if (!exam) throw new NotFoundException('Exame não encontrado no catálogo.');
    if (!exam.codigoTUSS) throw new BadRequestException('O exame selecionado não possui código TUSS.');

    if (data.isConvenio && !data.cid10Id) throw new BadRequestException('CID-10 é obrigatório para solicitações via convênio.');

    // 🔥 CORREÇÃO: Busca o ID real do Médico (pois a tabela exige um Doctor ID, e não um User ID)
    let doctorId = userId;
    const doctor = await this.prisma.doctor.findFirst({ where: { userId, tenantId, deletedAt: null } });

    if (doctor) {
      doctorId = doctor.id;
    } else {
      // 🚀 BYPASS VIP PARA O MASTER ADMIN
      // Se não for um médico real (é o admin testando), o sistema seleciona automaticamente o plantonista principal para autorizar o teste.
      const anyDoctor = await this.prisma.doctor.findFirst({ where: { tenantId, deletedAt: null } });
      if (!anyDoctor) {
        throw new BadRequestException('Para solicitar exames, é necessário ter pelo menos um médico cadastrado na unidade para assinar o pedido.');
      }
      doctorId = anyDoctor.id;
    }

    const codigoAutorizacao = data.isConvenio ? `AUTH-${crypto.randomBytes(4).toString('hex').toUpperCase()}` : null;

    const request = new ExamRequest(
      crypto.randomUUID(), tenantId, data.medicalRecordId, data.hospitalizationId || null,
      doctorId, record.patientId, data.examId, data.cid10Id || null, new Date(),
      data.urgencia ?? 'ROTINA', 'SOLICITADO', null, null, data.observacoes || null,
      codigoAutorizacao, new Date(), new Date(), null
    );

    const created = await this.examRequestRepo.create(request);
    await this.medicalRecordRepo.logAccess(tenantId, userId, record.patientId, 'SOLICITAR_EXAME', ip, userAgent);
    return created;
  }

  async findAll(tenantId: string, query: QueryExamRequestsDto, userId: string, ip: string, userAgent: string) {
    const { page, limit, patientId, status, dataInicial, dataFinal } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    const filters = { patientId, status, dataInicial, dataFinal };

    const { data, total } = await this.examRequestRepo.findAll(tenantId, skip, take, filters);

    if (patientId) {
      await this.medicalRecordRepo.logAccess(tenantId, userId, patientId, 'LISTAR_EXAMES', ip, userAgent);
    }

    return buildPaginatedResult(data, total, page, limit);
  }

  async registerResult(requestId: string, tenantId: string, resultado: string, userId: string, ip: string, userAgent: string) {
    const request = await this.examRequestRepo.findById(requestId, tenantId);
    if (!request) throw new NotFoundException('Solicitação de exame não encontrada.');
    if (request.status === 'CONCLUIDO') throw new BadRequestException('Resultado já laudado.');

    const record = await this.medicalRecordRepo.findById(request.medicalRecordId, tenantId);
    await this.examRequestRepo.updateResult(requestId, tenantId, resultado, 'CONCLUIDO', new Date());
    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, 'LAUDAR_EXAME', ip, userAgent);
    return { id: requestId, status: 'CONCLUIDO', resultado };
  }

  async cancel(requestId: string, tenantId: string, userId: string, ip: string, userAgent: string) {
    const request = await this.examRequestRepo.findById(requestId, tenantId);
    if (!request) throw new NotFoundException('Solicitação de exame não encontrada.');
    if (request.status === 'CONCLUIDO') throw new BadRequestException('Não é possível cancelar um exame já laudado.');
    
    // 🔥 CORREÇÃO TYPE SAFETY: Garantido que dataHoraResultado nunca será nulo neste método
    await this.examRequestRepo.updateResult(requestId, tenantId, request.resultado ?? '', 'CANCELADO', request.dataHoraResultado ?? new Date());
    
    return { id: requestId, status: 'CANCELADO' };
  }

  async updateStatus(requestId: string, tenantId: string, status: string, userId: string, ip: string, userAgent: string) {
    const request = await this.examRequestRepo.findById(requestId, tenantId);
    if (!request) throw new NotFoundException('Solicitação de exame não encontrada.');
    
    await this.examRequestRepo.updateStatus(requestId, tenantId, status);
    
    const record = await this.medicalRecordRepo.findById(request.medicalRecordId, tenantId);
    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, `ATUALIZAR_STATUS_EXAME_${status}`, ip, userAgent);
    
    return { id: requestId, status };
  }
}