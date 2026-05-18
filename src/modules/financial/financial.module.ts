import { Module } from '@nestjs/common';
import { FinancialController } from './financial.controller';
import { CostCenterUseCases } from '../../shared/application/use-cases/financial/cost-center.use-cases';
import { ChartOfAccountsUseCases } from '../../shared/application/use-cases/financial/chart-of-accounts.use-cases';
import { FinancialTransactionUseCases } from '../../shared/application/use-cases/financial/financial-transaction.use-cases';

import { COST_CENTER_REPOSITORY_TOKEN } from '../../shared/domain/repositories/cost-center.repository.interface';
import { CHART_OF_ACCOUNTS_REPOSITORY_TOKEN } from '../../shared/domain/repositories/chart-of-accounts.repository.interface';
import { FINANCIAL_TRANSACTION_REPOSITORY_TOKEN } from '../../shared/domain/repositories/financial-transaction.repository.interface';

import { PrismaCostCenterRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-cost-center.repository';
import { PrismaChartOfAccountsRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-chart-of-accounts.repository';
import { PrismaFinancialTransactionRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-financial-transaction.repository';

@Module({
  controllers: [FinancialController],
  providers: [
    {
      provide: COST_CENTER_REPOSITORY_TOKEN,
      useClass: PrismaCostCenterRepository,
    },
    {
      provide: CHART_OF_ACCOUNTS_REPOSITORY_TOKEN,
      useClass: PrismaChartOfAccountsRepository,
    },
    {
      provide: FINANCIAL_TRANSACTION_REPOSITORY_TOKEN,
      useClass: PrismaFinancialTransactionRepository,
    },
    CostCenterUseCases,
    ChartOfAccountsUseCases,
    FinancialTransactionUseCases,
  ],
  exports: [
    FinancialTransactionUseCases // Exportado caso módulos futuros precisem lançar pagamentos
  ],
})
export class FinancialModule {}