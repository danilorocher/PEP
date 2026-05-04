import { Global, Module } from '@nestjs/common';
import { HospitalBillingController } from './hospital-billing.controller';
import { HospitalBillingUseCases } from '../../shared/application/use-cases/hospital-billing/hospital-billing.use-cases';
import { AccountConsumptionService } from '../../shared/application/use-cases/hospital-billing/account-consumption.service';

@Global() // Deixamos global para que qualquer outro módulo possa injetar o AccountConsumptionService facilmente
@Module({
  controllers: [HospitalBillingController],
  providers: [HospitalBillingUseCases, AccountConsumptionService],
  exports: [HospitalBillingUseCases, AccountConsumptionService]
})
export class HospitalBillingModule {}