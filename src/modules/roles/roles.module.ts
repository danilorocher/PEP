import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesUseCases } from '../../shared/application/use-cases/users/roles/roles.use-cases';
import { ROLE_REPOSITORY_TOKEN } from '../../shared/domain/repositories/role.repository.interface';
import { PrismaRoleRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-role.repository';

@Module({
  controllers: [RolesController],
  providers: [
    RolesUseCases,
    { provide: ROLE_REPOSITORY_TOKEN, useClass: PrismaRoleRepository },
  ],
})
export class RolesModule {}