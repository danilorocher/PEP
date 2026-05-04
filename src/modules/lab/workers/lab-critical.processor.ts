import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma/repositories/prisma.service';

@Processor('lab-critical-alert')
export class LabCriticalProcessor extends WorkerHost {
  private readonly logger = new Logger(LabCriticalProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    const { tenantId, patientName, examName, value } = job.data;

    this.logger.warn(`🚨 ALERTA CRÍTICO - Paciente: ${patientName} | Exame: ${examName} | Valor: ${value}`);

    // Em uma implementação real, aqui dispararíamos:
    // 1. Notificação push para o médico responsável
    // 2. Registro na tabela de notificações do sistema
    // 3. SMS/WhatsApp dependendo da urgência
    
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: 'SYSTEM',
        acao: 'CRITICAL_RESULT_ALERT',
        entidade: 'lab_result',
        entidadeId: job.id as string,
        dadosNovos: job.data,
      }
    });
  }
}