import { Module } from '@nestjs/common';
import { AssistanceController } from './assistance.controller';
import { VitalSignsUseCases } from '../../shared/application/use-cases/assistance/vital-signs.use-cases';
import { FluidBalanceUseCases } from '../../shared/application/use-cases/assistance/fluid-balance.use-cases';
import { RiskAssessmentsUseCases } from '../../shared/application/use-cases/assistance/risk-assessments.use-cases';

@Module({
  controllers: [AssistanceController],
  providers: [
    VitalSignsUseCases,
    FluidBalanceUseCases,
    RiskAssessmentsUseCases
  ],
  exports: [VitalSignsUseCases, FluidBalanceUseCases, RiskAssessmentsUseCases]
})
export class AssistanceModule {}