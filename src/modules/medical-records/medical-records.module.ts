import { Module } from '@nestjs/common';

// Controllers
import { MedicalRecordsController } from './medical-records.controller';

// Use Cases
import { MedicalRecordsUseCases } from '../../shared/application/use-cases/medical-records/medical-records.use-cases';

// Tokens (interfaces)
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';

// Implementações (Prisma)
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';

// Services
import { EncryptionService } from '../../shared/infrastructure/database/prisma/repositories/services/encryption.service';

@Module({
  controllers: [MedicalRecordsController],

  providers: [
    MedicalRecordsUseCases,

    // Repository (injeção via token)
    {
      provide: MEDICAL_RECORD_REPOSITORY_TOKEN,
      useClass: PrismaMedicalRecordRepository,
    },

    // Service necessário para criptografia
    EncryptionService,
  ],

  // 🔥 ESSENCIAL para outros módulos (como Exams)
  exports: [
    MedicalRecordsUseCases,
    MEDICAL_RECORD_REPOSITORY_TOKEN,
    EncryptionService, // 👈 adicionamos para evitar erro futuro
  ],
})
export class MedicalRecordsModule {}