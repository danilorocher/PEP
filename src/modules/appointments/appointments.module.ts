import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsUseCases } from '../../shared/application/use-cases/appointments/appointments.use-cases';
import { APPOINTMENT_REPOSITORY_TOKEN } from '../../shared/domain/repositories/appointment.repository.interface';
import { PrismaAppointmentRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-appointment.repository';

@Module({
  imports: [
    // Registra a Fila 'notifications' no Redis/BullMQ exigida no Use Case
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsUseCases,
    { provide: APPOINTMENT_REPOSITORY_TOKEN, useClass: PrismaAppointmentRepository },
  ],
})
export class AppointmentsModule {}