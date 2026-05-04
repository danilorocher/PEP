import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
// 🔥 NOVA IMPORTAÇÃO AQUI:
import { PermissionsController } from './permissions.controller'; 
import { RolesUseCases } from '../../shared/application/use-cases/roles/roles.use-cases';
import { ROLE_REPOSITORY_TOKEN } from '../../shared/domain/repositories/role.repository.interface';
import { PrismaRoleRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-role.repository';

@Module({
  // 🔥 ADICIONAMOS O PermissionsController AQUI:
  controllers: [RolesController, PermissionsController], 
  providers: [
    RolesUseCases,
    { provide: ROLE_REPOSITORY_TOKEN, useClass: PrismaRoleRepository },
  ],
})
export class RolesModule {}