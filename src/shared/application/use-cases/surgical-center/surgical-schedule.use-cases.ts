import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { CreateSurgicalScheduleDto } from '../../../../modules/surgical-center/dto/surgical-center.dto';

@Injectable()
export class SurgicalScheduleUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async scheduleSurgery(tenantId: string, data: CreateSurgicalScheduleDto) {
    const dataCirurgia = new Date(data.dataCirurgia);
    
    // Regra Crítica: Verificação de Conflitos (Janela de 2 horas para garantir intervalo)
    const windowStart = new Date(dataCirurgia.getTime() - 2 * 60 * 60 * 1000);
    const windowEnd = new Date(dataCirurgia.getTime() + 2 * 60 * 60 * 1000);

    const conflict = await this.prisma.surgicalSchedule.findFirst({
      where: {
        tenantId,
        status: { in: ['AGENDADO', 'PRE_OPERATORIO', 'EM_ANDAMENTO'] },
        dataCirurgia: { gte: windowStart, lte: windowEnd },
        OR: [
          { salaId: data.salaId },
          { cirurgiaoId: data.cirurgiaoId },
          { anestesistaId: data.anestesistaId },
          { enfermeiroId: data.enfermeiroId }
        ]
      }
    });

    if (conflict) {
      throw new BadRequestException('Conflito detectado: A sala ou um membro da equipe já possui alocação neste horário.');
    }

    return await this.prisma.surgicalSchedule.create({
      data: { tenantId, ...data, dataCirurgia }
    });
  }

  async listSchedules(tenantId: string, startDate?: Date, endDate?: Date) {
    return await this.prisma.surgicalSchedule.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(startDate && endDate && { dataCirurgia: { gte: startDate, lte: endDate } })
      },
      include: {
        patient: { select: { nomeCompleto: true, cpf: true } },
        sala: { select: { nome: true } },
        cirurgiao: { select: { nomeCompleto: true } }
      },
      orderBy: { dataCirurgia: 'asc' }
    });
  }

  async getResourceCatalog(tenantId: string) {
    return await this.prisma.surgicalResource.findMany({
      where: { tenantId, deletedAt: null, status: 'ATIVO' }
    });
  }
}