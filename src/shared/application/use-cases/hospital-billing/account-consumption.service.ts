import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { RecordConsumptionDto } from '../../../../modules/hospital-billing/dto/hospital-billing.dto';

@Injectable()
export class AccountConsumptionService {
  private readonly logger = new Logger(AccountConsumptionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtém a conta hospitalar ABERTA do paciente, ou cria uma nova se não existir.
   */
  async getOrOpenAccount(tenantId: string, patientId: string, hospitalizationId?: string, appointmentId?: string) {
    let account = await this.prisma.hospitalAccount.findFirst({
      where: {
        tenantId,
        patientId,
        status: 'OPEN',
        deletedAt: null,
      }
    });

    if (!account) {
      account = await this.prisma.hospitalAccount.create({
        data: {
          tenantId,
          patientId,
          hospitalizationId,
          appointmentId,
          status: 'OPEN',
          totalAmount: 0.0
        }
      });
      this.logger.log(`Nova Conta Hospitalar Aberta para o paciente ${patientId}`);
    }

    return account;
  }

  /**
   * Regista um consumo na conta do paciente (Ex: Gaze, Medicamento, Taxa de Sala).
   * Operação ACID: Cria o item e atualiza o saldo da conta numa única transação.
   */
  async recordConsumption(tenantId: string, data: RecordConsumptionDto) {
    return await this.prisma.$transaction(async (tx) => {
      const account = await this.getOrOpenAccount(tenantId, data.patientId, data.hospitalizationId, data.appointmentId);
      
      const totalPrice = data.quantity * data.unitPrice;

      const item = await tx.hospitalAccountItem.create({
        data: {
          tenantId,
          accountId: account.id,
          tipo: data.tipo,
          description: data.description,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalPrice,
          referenceId: data.referenceId,
          sourceModule: data.sourceModule,
        }
      });

      // Atualiza o valor total da conta hospitalar
      await tx.hospitalAccount.update({
        where: { id: account.id },
        data: { totalAmount: { increment: totalPrice } }
      });

      this.logger.log(`Consumo registado: ${data.description} | R$ ${totalPrice} | Conta: ${account.id}`);
      return item;
    });
  }

  // Exemplos de métodos wrapper que podem ser chamados pelos módulos
  async addItemFromPharmacy(tenantId: string, patientId: string, medicationName: string, qty: number, price: number, refId: string) {
    return this.recordConsumption(tenantId, {
      patientId,
      tipo: 'MEDICATION',
      description: `Dispensação Farmácia: ${medicationName}`,
      quantity: qty,
      unitPrice: price,
      sourceModule: 'PHARMACY',
      referenceId: refId
    });
  }

  async addDailyRates(tenantId: string, patientId: string, hospId: string, days: number, dailyPrice: number) {
    return this.recordConsumption(tenantId, {
      patientId,
      hospitalizationId: hospId,
      tipo: 'DAILY_RATE',
      description: `Diária Hospitalar (${days} dias)`,
      quantity: days,
      unitPrice: dailyPrice,
      sourceModule: 'MANUAL'
    });
  }
}