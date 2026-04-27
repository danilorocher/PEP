import { Module } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsUseCases } from '../../shared/application/use-cases/patients/patients.use-cases';
import { PATIENT_REPOSITORY_TOKEN } from '../../shared/domain/repositories/patient.repository.interface';
import { PrismaPatientRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-patient.repository';
import { EncryptionService } from '../../shared/infrastructure/database/prisma/repositories/services/encryption.service';

@Module({
  controllers: [PatientsController],
  providers: [
    PatientsUseCases,
    EncryptionService,
    { provide: PATIENT_REPOSITORY_TOKEN, useClass: PrismaPatientRepository },
  ],
})
export class PatientsModule {}