import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MedicationsController } from '../../medications/medications.controller';
import { MedicationAdministrationsUseCases } from '../../shared/application/use-cases/medications/medication-administrations.use-cases';
import { PRESCRIPTION_REPOSITORY_TOKEN } from '../../shared/domain/repositories/prescription.repository.interface';
import { PrismaPrescriptionRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-prescription.repository';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';
import { MedicationStatusProcessor } from '../../medications/workers/medication-status.processor';
import { MedicationStatusSchedulerService } from '../../medications/workers/medication-status-scheduler.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'medication-status',
    }),
  ],
  controllers: [MedicationsController],
  providers: [
    MedicationAdministrationsUseCases,
    MedicationStatusProcessor,
    MedicationStatusSchedulerService,
    { provide: PRESCRIPTION_REPOSITORY_TOKEN, useClass: PrismaPrescriptionRepository },
    { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useClass: PrismaMedicalRecordRepository },
  ],
})
export class MedicationsModule {}