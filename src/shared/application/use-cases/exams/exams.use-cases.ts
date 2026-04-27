import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamRepository, EXAM_REPOSITORY_TOKEN } from '../../../domain/repositories/exam.repository.interface';
import { Exam } from '../../../domain/entities/exam.entity';
import * as crypto from 'crypto';
import { CreateExamDto, UpdateExamDto } from '../../../../modules/exams/dto/exam.dto';

@Injectable()
export class ExamsUseCases {
  constructor(
    @Inject(EXAM_REPOSITORY_TOKEN) private readonly examRepo: IExamRepository,
  ) {}

  async create(tenantId: string, data: CreateExamDto): Promise<Exam> {
    const newExam = new Exam(
      crypto.randomUUID(), tenantId, data.nome, data.tipo, data.tempoMedioResultado || null,
      data.preparacaoNecessaria || null, data.codigoInterno || null, data.codigoTUSS,
      'ATIVO', new Date(), new Date(), null
    );
    return this.examRepo.create(newExam);
  }

  async findAll(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.examRepo.findAll(tenantId, skip, limit);
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Exam> {
    const exam = await this.examRepo.findById(id, tenantId);
    if (!exam) throw new NotFoundException('Exame não encontrado no catálogo.');
    return exam;
  }

  async update(id: string, tenantId: string, data: UpdateExamDto): Promise<void> {
    const exam = await this.findOne(id, tenantId);
    const updatedExam = new Exam(
      exam.id, exam.tenantId, data.nome || exam.nome, data.tipo || exam.tipo,
      data.tempoMedioResultado !== undefined ? data.tempoMedioResultado : exam.tempoMedioResultado,
      data.preparacaoNecessaria !== undefined ? data.preparacaoNecessaria : exam.preparacaoNecessaria,
      data.codigoInterno !== undefined ? data.codigoInterno : exam.codigoInterno,
      data.codigoTUSS || exam.codigoTUSS, data.status || exam.status,
      exam.createdAt, new Date(), exam.deletedAt
    );
    await this.examRepo.update(updatedExam);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.examRepo.softDelete(id, tenantId);
  }
}