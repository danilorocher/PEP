import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IExamRequestRepository } from '../../../../domain/repositories/exam-request.repository.interface';
import { ExamRequest } from '../../../../domain/entities/exam-request.entity';

@Injectable()
export class PrismaExamRequestRepository implements IExamRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): ExamRequest {
    if (!record) return null;
    return new ExamRequest(
      record.id, record.tenantId, record.medicalRecordId, record.hospitalizationId,
      record.solicitadoPor, record.patientId, record.examId, record.cid10Id,
      record.dataHoraSolicitacao, record.urgencia, record.status, record.resultado,
      record.dataHoraResultado, record.observacoes, record.codigoAutorizacaoConvenio,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(request: ExamRequest): Promise<ExamRequest> {
    const created = await this.prisma.examRequest.create({
      data: {
        id: request.id, tenantId: request.tenantId, medicalRecordId: request.medicalRecordId,
        hospitalizationId: request.hospitalizationId, solicitadoPor: request.solicitadoPor,
        patientId: request.patientId, examId: request.examId, cid10Id: request.cid10Id,
        dataHoraSolicitacao: request.dataHoraSolicitacao, urgencia: request.urgencia as any,
        status: request.status as any, resultado: request.resultado,
        dataHoraResultado: request.dataHoraResultado, observacoes: request.observacoes,
        codigoAutorizacaoConvenio: request.codigoAutorizacaoConvenio
      }
    });
    return this.toDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<ExamRequest | null> {
    const record = await this.prisma.examRequest.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: ExamRequest[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.medicalRecordId) where.medicalRecordId = filters.medicalRecordId;
    if (filters?.status) where.status = filters.status;

    const [data, total] = await Promise.all([
      this.prisma.examRequest.findMany({ where, skip, take, orderBy: { dataHoraSolicitacao: 'desc' }, include: { exam: true } }),
      this.prisma.examRequest.count({ where })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async updateResult(id: string, tenantId: string, resultado: string, status: string, dataHora: Date): Promise<void> {
    await this.prisma.examRequest.update({
      where: { id, tenantId },
      data: { resultado, status: status as any, dataHoraResultado: dataHora }
    });
  }
}