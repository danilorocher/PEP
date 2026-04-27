import { Module } from '@nestjs/common';
import { BillingUseCases } from '../../shared/application/use-cases/billing/billing.use-cases';
import { BILLING_REPOSITORY_TOKEN } from '../../shared/domain/repositories/billing.repository.interface';
import { PrismaBillingRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-billing.repository';

@Module({
  providers: [
    BillingUseCases,
    {
      provide: BILLING_REPOSITORY_TOKEN,
      useClass: PrismaBillingRepository,
    },
  ],
  exports: [BillingUseCases],
})
export class BillingModule {}