import { Module } from '@nestjs/common';
import { HospitalizationsController } from './hospitalizations.controller';
import { HospitalizationsUseCases } from '../../shared/application/use-cases/hospitalizations/hospitalizations.use-cases';
import { HOSPITALIZATION_REPOSITORY_TOKEN } from '../../shared/domain/repositories/hospitalization.repository.interface';
import { PrismaHospitalizationRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-hospitalization.repository';
import { BED_REPOSITORY_TOKEN } from '../../shared/domain/repositories/bed.repository.interface';
import { PrismaBedRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-bed.repository';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';

@Module({
  controllers: [HospitalizationsController],
  providers: [
    HospitalizationsUseCases,
    { provide: HOSPITALIZATION_REPOSITORY_TOKEN, useClass: PrismaHospitalizationRepository },
    { provide: BED_REPOSITORY_TOKEN, useClass: PrismaBedRepository },
    { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useClass: PrismaMedicalRecordRepository },
  ],
})
export class HospitalizationsModule {}
