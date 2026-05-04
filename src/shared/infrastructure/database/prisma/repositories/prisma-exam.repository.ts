import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IExamRepository } from '../../../../domain/repositories/exam.repository.interface';
import { Exam } from '../../../../domain/entities/exam.entity';

@Injectable()
export class PrismaExamRepository implements IExamRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Exam {
    if (!record) return null;
    return new Exam(
      record.id, record.tenantId, record.nome, record.tipo, record.tempoMedioResultado,
      record.preparacaoNecessaria, record.codigoInterno, record.codigoTUSS, record.status,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(exam: Exam): Promise<Exam> {
    const created = await this.prisma.exam.create({
      data: {
        id: exam.id, tenantId: exam.tenantId, nome: exam.nome, tipo: exam.tipo as any,
        tempoMedioResultado: exam.tempoMedioResultado, preparacaoNecessaria: exam.preparacaoNecessaria,
        codigoInterno: exam.codigoInterno, codigoTUSS: exam.codigoTUSS, status: exam.status as any
      }
    });
    return this.toDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<Exam | null> {
    const record = await this.prisma.exam.findFirst({ where: { id, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: Exam[]; total: number }> {
    const where: any = { tenantId, deletedAt: null };
    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.search) {
      where.OR = [
        { nome: { contains: filters.search, mode: 'insensitive' } },
        { codigoTUSS: { contains: filters.search } }
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.exam.findMany({ where, skip, take, orderBy: { nome: 'asc' } }),
      this.prisma.exam.count({ where })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async update(exam: Exam): Promise<void> {
    await this.prisma.exam.update({
      where: { id: exam.id },
      data: {
        nome: exam.nome, tipo: exam.tipo as any, tempoMedioResultado: exam.tempoMedioResultado,
        preparacaoNecessaria: exam.preparacaoNecessaria, codigoInterno: exam.codigoInterno,
        codigoTUSS: exam.codigoTUSS, status: exam.status as any
      }
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.exam.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'INATIVO' }
    });
  }
}