import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsUseCases } from '../../shared/application/use-cases/appointments/appointments.use-cases';
import { APPOINTMENT_REPOSITORY_TOKEN } from '../../shared/domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-appointment.repository';

// 🔥 IMPORTAÇÕES DA FASE 3: O Motor de Automação do WhatsApp
import { AppointmentCronService } from './workers/appointment-cron.service';
import { AppointmentNotificationProcessor } from './workers/appointment-notification.processor';

@Module({
  imports: [
    // Registra a Fila 'notifications' no Redis/BullMQ exigida no Use Case (MANTIDO INTACTO)
    BullModule.registerQueue({
      name: 'notifications',
    }),
    
    // 🔥 FASE 3: Registra a nova fila dedicada aos Lembretes de WhatsApp
    BullModule.registerQueue({
      name: 'whatsapp-notifications',
    }),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsUseCases,
    { provide: APPOINTMENT_REPOSITORY_TOKEN, useClass: PrismaAppointmentRepository },
    
    // 🔥 FASE 3: Injeta o "Despertador" (Cron) e o "Funcionário Virtual" (Processor) no Módulo
    AppointmentCronService,
    AppointmentNotificationProcessor,
  ],
})
export class AppointmentsModule {}