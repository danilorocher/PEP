import { Module } from '@nestjs/common';
import { WardsController } from './wards.controller';
import { WardsUseCases } from '../../shared/application/use-cases/wards/wards.use-cases';
import { WARD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/ward.repository.interface';
import { PrismaWardRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-ward.repository';

@Module({
  controllers: [WardsController],
  providers: [
    WardsUseCases,
    { provide: WARD_REPOSITORY_TOKEN, useClass: PrismaWardRepository },
  ],
})
export class WardsModule {}