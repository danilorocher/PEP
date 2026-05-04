import { Module } from '@nestjs/common';
import { SurgicalCenterController } from './surgical-center.controller';
import { SurgicalScheduleUseCases } from '../../shared/application/use-cases/surgical-center/surgical-schedule.use-cases';
import { SurgicalExecutionUseCases } from '../../shared/application/use-cases/surgical-center/surgical-execution.use-cases';

@Module({
  controllers: [SurgicalCenterController],
  providers: [SurgicalScheduleUseCases, SurgicalExecutionUseCases],
  exports: [SurgicalScheduleUseCases, SurgicalExecutionUseCases]
})
export class SurgicalCenterModule {}