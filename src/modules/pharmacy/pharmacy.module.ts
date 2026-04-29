import { Module } from '@nestjs/common';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyStockUseCases } from '../../shared/application/use-cases/pharmacy/stock.use-cases';
import { PharmacyDispensationUseCases } from '../../shared/application/use-cases/pharmacy/dispensation.use-cases';
import { PharmacyInteractionUseCases } from '../../shared/application/use-cases/pharmacy/interaction.use-cases';

@Module({
  controllers: [PharmacyController],
  providers: [
    PharmacyStockUseCases,
    PharmacyDispensationUseCases,
    PharmacyInteractionUseCases
  ],
  exports: [
    PharmacyStockUseCases,
    PharmacyDispensationUseCases,
    PharmacyInteractionUseCases
  ]
})
export class PharmacyModule {}