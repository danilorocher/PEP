import { Module } from '@common';
import { UsersController } from './users.controller';
import { UsersUseCases } from '../../shared/application/use-cases/users/users.use-cases';
import { USER_REPOSITORY_TOKEN } from '../../shared/domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-user.repository';
import { EncryptionService } from '../../shared/infrastructure/database/prisma/repositories/services/encryption.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersUseCases,
    EncryptionService,
    { provide: USER_REPOSITORY_TOKEN, useClass: PrismaUserRepository },
  ],
  exports: [UsersUseCases, USER_REPOSITORY_TOKEN],
})
export class UsersModule {}