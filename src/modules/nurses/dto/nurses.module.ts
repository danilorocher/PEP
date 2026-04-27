import { Module } from '@common';
import { NursesController } from './nurses.controller';
import { NursesUseCases } from '../../shared/application/use-cases/nurses/nurses.use-cases';
import { NURSE_REPOSITORY_TOKEN } from '../../shared/domain/repositories/nurse.repository.interface';
import { PrismaNurseRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-nurse.repository';
import { EncryptionService } from '../../shared/infrastructure/database/prisma/repositories/services/encryption.service';

@Module({
  controllers: [NursesController],
  providers: [
    NursesUseCases,
    EncryptionService,
    { provide: NURSE_REPOSITORY_TOKEN, useClass: PrismaNurseRepository },
  ],
})
export class NursesModule {}