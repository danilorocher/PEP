import { Module } from '@common';
import { DoctorsController } from './doctors.controller';
import { DoctorsUseCases } from '../../shared/application/use-cases/doctors/doctors.use-cases';
import { DOCTOR_REPOSITORY_TOKEN } from '../../shared/domain/repositories/doctor.repository.interface';
import { PrismaDoctorRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-doctor.repository';
import { EncryptionService } from '../../shared/infrastructure/database/prisma/repositories/services/encryption.service';

@Module({
  controllers: [DoctorsController],
  providers: [
    DoctorsUseCases,
    EncryptionService,
    { provide: DOCTOR_REPOSITORY_TOKEN, useClass: PrismaDoctorRepository },
  ],
})
export class DoctorsModule {}