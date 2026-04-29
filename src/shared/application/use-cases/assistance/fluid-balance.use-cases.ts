import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { CreateFluidBalanceDto, AddFluidEntryDto, AddFluidOutputDto } from '../../../../modules/assistance/dto/assistance.dto';

@Injectable()
export class FluidBalanceUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async openBalance(tenantId: string, userId: string, data: CreateFluidBalanceDto) {
    return await this.prisma.fluidBalance.create({
      data: {
        tenantId,
        registeredById: userId,
        patientId: data.patientId,
        hospitalizationId: data.hospitalizationId,
        dataHoraReferencia: new Date(data.dataHoraReferencia),
        status: 'EM_ANDAMENTO'
      }
    });
  }

  // Regra centralizada: Recalcula e atualiza o balanço automaticamente
  private async recalculateBalance(tx: any, fluidBalanceId: string, tenantId: string) {
    const [inSum, outSum] = await Promise.all([
      tx.fluidEntry.aggregate({ _sum: { volumeMl: true }, where: { fluidBalanceId, tenantId, deletedAt: null } }),
      tx.fluidOutput.aggregate({ _sum: { volumeMl: true }, where: { fluidBalanceId, tenantId, deletedAt: null } })
    ]);

    const totalInput = inSum._sum.volumeMl || 0;
    const totalOutput = outSum._sum.volumeMl || 0;
    const balance = totalInput - totalOutput;

    return await tx.fluidBalance.update({
      where: { id: fluidBalanceId },
      data: { totalInput, totalOutput, balance }
    });
  }

  async addEntry(tenantId: string, userId: string, balanceId: string, data: AddFluidEntryDto) {
    return await this.prisma.$transaction(async (tx) => {
      const balance = await tx.fluidBalance.findFirst({ where: { id: balanceId, tenantId, status: 'EM_ANDAMENTO' }});
      if (!balance) throw new BadRequestException('Balanço fechado ou não encontrado.');

      await tx.fluidEntry.create({
        data: { tenantId, fluidBalanceId: balanceId, registeredById: userId, ...data }
      });
      return this.recalculateBalance(tx, balanceId, tenantId);
    });
  }

  async addOutput(tenantId: string, userId: string, balanceId: string, data: AddFluidOutputDto) {
    return await this.prisma.$transaction(async (tx) => {
      const balance = await tx.fluidBalance.findFirst({ where: { id: balanceId, tenantId, status: 'EM_ANDAMENTO' }});
      if (!balance) throw new BadRequestException('Balanço fechado ou não encontrado.');

      await tx.fluidOutput.create({
        data: { tenantId, fluidBalanceId: balanceId, registeredById: userId, ...data }
      });
      return this.recalculateBalance(tx, balanceId, tenantId);
    });
  }

  async findByPatient(tenantId: string, patientId: string) {
    return await this.prisma.fluidBalance.findMany({
      where: { tenantId, patientId, deletedAt: null },
      orderBy: { dataHoraReferencia: 'desc' },
      include: { entries: true, outputs: true }
    });
  }
}