import { Module } from '@nestjs/common';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsUseCases } from '../../shared/application/use-cases/prescriptions/prescriptions.use-cases';
import { PRESCRIPTION_REPOSITORY_TOKEN } from '../../shared/domain/repositories/prescription.repository.interface';
import { PrismaPrescriptionRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-prescription.repository';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';
import { NURSE_REPOSITORY_TOKEN } from '../../shared/domain/repositories/nurse.repository.interface';
import { PrismaNurseRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-nurse.repository';

@Module({
  controllers: [PrescriptionsController],
  providers: [
    PrescriptionsUseCases,
    { provide: PRESCRIPTION_REPOSITORY_TOKEN, useClass: PrismaPrescriptionRepository },
    { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useClass: PrismaMedicalRecordRepository },
    { provide: NURSE_REPOSITORY_TOKEN, useClass: PrismaNurseRepository },
  ],
  exports: [PrescriptionsUseCases, PRESCRIPTION_REPOSITORY_TOKEN],
})
export class PrescriptionsModule {}