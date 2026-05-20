import { Module } from '@nestjs/common';
import { InsurancesService } from './insurances.service';
import { InsurancesController } from './insurances.controller';
import { PrismaModule } from '../../shared/infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InsurancesController],
  providers: [InsurancesService],
  exports: [InsurancesService],
})
export class InsurancesModule {}