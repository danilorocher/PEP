import { Module } from '@nestjs/common';
import { BedsController } from './beds.controller';
import { BedsUseCases } from '../../shared/application/use-cases/beds/beds.use-cases';
import { BED_REPOSITORY_TOKEN } from '../../shared/domain/repositories/bed.repository.interface';
import { PrismaBedRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-bed.repository';

@Module({
  controllers: [BedsController],
  providers: [
    BedsUseCases,
    { provide: BED_REPOSITORY_TOKEN, useClass: PrismaBedRepository },
  ],
})
export class BedsModule {}