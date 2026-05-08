import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../../shared/infrastructure/database/prisma/repositories/prisma.service';

@Injectable()
export class AppointmentCronService {
  private readonly logger = new Logger(AppointmentCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    // Injeta a fila de notificações do BullMQ
    @InjectQueue('whatsapp-notifications') private notificationQueue: Queue, 
  ) {}

  // 🔥 Roda todos os dias às 08:00 da manhã
  @Cron(CronExpression.EVERY_DAY_AT_8AM) 
  async scheduleReminders() {
    this.logger.log('🔍 Buscando agendamentos de amanhã para enviar lembretes...');
    
    const hoje = new Date();
    const amanhaInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1, 0, 0, 0);
    const amanhaFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1, 23, 59, 59);

    const agendamentos = await this.prisma.appointment.findMany({
      where: {
        status: 'AGENDADO', // Só avisa quem ainda não confirmou
        // 🔥 CORREÇÃO: Usando a coluna exata do seu schema.prisma (dataHora)
        dataHora: { gte: amanhaInicio, lte: amanhaFim } 
      },
      include: { patient: true, doctor: true, tenant: true }
    });

    for (const appt of agendamentos) {
      // Adiciona na fila do BullMQ para processamento assíncrono
      await this.notificationQueue.add('send-reminder', {
        appointmentId: appt.id,
        patientName: appt.patient.nomeCompleto,
        patientPhone: appt.patient.telefone,
        doctorName: appt.doctor.nomeCompleto,
        tenantName: appt.tenant.name,
        // 🔥 CORREÇÃO: Usando a coluna exata (dataHora)
        date: appt.dataHora 
      });
    }

    if (agendamentos.length > 0) {
      this.logger.log(`✅ ${agendamentos.length} lembretes enfileirados no BullMQ.`);
    } else {
      this.logger.log('Nenhum agendamento encontrado para disparar lembretes amanhã.');
    }
  }
}