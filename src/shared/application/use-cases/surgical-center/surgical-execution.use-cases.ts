import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { 
  CreatePreOpChecklistDto, CreateAnesthesiaRecordDto, 
  CreateSurgicalReportDto, RegisterOpmeUsageDto, CreatePostOpChecklistDto 
} from '../../../../modules/surgical-center/dto/surgical-center.dto';

@Injectable()
export class SurgicalExecutionUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async registerPreOpChecklist(tenantId: string, cirurgiaId: string, userId: string, data: CreatePreOpChecklistDto) {
    await this.prisma.surgicalSchedule.update({ where: { id: cirurgiaId }, data: { status: 'PRE_OPERATORIO' } });

    return await this.prisma.preOpChecklist.upsert({
      where: { cirurgiaId },
      update: { profissionalResponsavel: userId, status: 'CONCLUIDO', ...data },
      create: { tenantId, cirurgiaId, profissionalResponsavel: userId, status: 'CONCLUIDO', ...data }
    });
  }

  async startSurgery(tenantId: string, cirurgiaId: string) {
    const checklist = await this.prisma.preOpChecklist.findUnique({ where: { cirurgiaId } });
    
    // Protocolo OMS de Cirurgia Segura (Bloqueio duro)
    if (!checklist || !checklist.pacienteConfirmado || !checklist.lateralidadeConfirmada || !checklist.jejumConfirmado || !checklist.alergiasVerificadas) {
      throw new BadRequestException('A cirurgia não pode ser iniciada: Checklist Pré-Operatório obrigatório (OMS) incompleto.');
    }

    return await this.prisma.surgicalSchedule.update({
      where: { id: cirurgiaId, tenantId },
      data: { status: 'EM_ANDAMENTO' }
    });
  }

  async registerAnesthesia(tenantId: string, cirurgiaId: string, anestesistaId: string, data: CreateAnesthesiaRecordDto) {
    return await this.prisma.anesthesiaRecord.create({
      data: {
        tenantId, cirurgiaId, anestesistaId,
        tipoAnestesia: data.tipoAnestesia,
        drogasUtilizadas: data.drogasUtilizadas,
        sinaisVitais: data.sinaisVitais,
        inicio: new Date(data.inicio),
        fim: data.fim ? new Date(data.fim) : null
      }
    });
  }

  async registerReport(tenantId: string, cirurgiaId: string, cirurgiaoId: string, data: CreateSurgicalReportDto) {
    return await this.prisma.surgicalReport.create({
      data: { tenantId, cirurgiaId, cirurgiaoId, ...data }
    });
  }

  async registerOPME(tenantId: string, cirurgiaId: string, data: RegisterOpmeUsageDto) {
    return await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const item of data.items) {
        // Rastreabilidade de OPME exigida pela Anvisa
        const record = await tx.surgeryOPME.create({
          data: {
            tenantId, cirurgiaId, opmeId: item.opmeId,
            quantidade: item.quantidade, rastreabilidadeConfirmada: true
          }
        });
        records.push(record);
      }
      return records;
    });
  }

  async registerPostOpChecklist(tenantId: string, cirurgiaId: string, userId: string, data: CreatePostOpChecklistDto) {
    const postOp = await this.prisma.postOpChecklist.create({
      data: { tenantId, cirurgiaId, profissionalResponsavel: userId, ...data }
    });

    await this.prisma.surgicalSchedule.update({
      where: { id: cirurgiaId },
      data: { status: data.liberadoAlta ? 'FINALIZADO' : 'RECUPERACAO' }
    });

    return postOp;
  }
}