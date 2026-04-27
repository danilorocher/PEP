import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ReportsController } from './reports.controller';
import { ReportsProcessor } from './reports.processor';
import { ReportsGeneratorUseCase } from './use-cases/reports-generator.use-case';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reports',
    }),
  ],
  controllers: [ReportsController],
  providers: [
    ReportsProcessor,
    ReportsGeneratorUseCase,
    RedisService,
  ],
  exports: [BullModule],
})
export class ReportsModule {}