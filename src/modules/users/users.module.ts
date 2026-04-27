import { Module } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../shared/domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-user.repository';
import { CreateUserUseCase } from '../../shared/application/use-cases/users/create-user.use-case';

@Module({
  providers: [
    // 1. Liga o Token (Interface) à classe concreta (Prisma)
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
    // 2. Provisão do Use Case
    CreateUserUseCase,
  ],
  exports: [CreateUserUseCase, USER_REPOSITORY_TOKEN],
})
export class UsersModule {}