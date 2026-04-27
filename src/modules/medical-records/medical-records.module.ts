import { Module } from '@nestjs/common';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsUseCases } from '../../shared/application/use-cases/medical-records/medical-records.use-cases';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';

@Module({
  controllers: [MedicalRecordsController],
  providers: [
    MedicalRecordsUseCases,
    { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useClass: PrismaMedicalRecordRepository },
  ],
  exports: [MedicalRecordsUseCases, MEDICAL_RECORD_REPOSITORY_TOKEN],
})
export class MedicalRecordsModule {}