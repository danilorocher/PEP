import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { AddStockDto } from '../../../../modules/pharmacy/dto/pharmacy.dto';
import * as crypto from 'crypto';

@Injectable()
export class PharmacyStockUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async addStock(tenantId: string, data: AddStockDto) {
    try {
      const localizacaoFinal = data.localizacao || 'Almoxarifado Central';
      const quantidadeAdd = parseFloat(data.quantidade.toString());

      const estoqueExistente = await this.prisma.medicationStock.findFirst({
        where: {
          tenantId,
          medicationId: data.medicationId,
          lote: data.lote,
          localizacao: localizacaoFinal
        }
      });

      if (estoqueExistente) {
        return await this.prisma.medicationStock.update({
          where: { id: estoqueExistente.id },
          data: {
            quantidade: estoqueExistente.quantidade + quantidadeAdd
          }
        });
      }

      return await this.prisma.medicationStock.create({
        data: {
          tenantId,
          medicationId: data.medicationId,
          lote: data.lote,
          dataFabricacao: data.dataFabricacao ? new Date(data.dataFabricacao) : null,
          validade: new Date(data.validade),
          quantidade: quantidadeAdd,
          localizacao: localizacaoFinal,
        }
      });
    } catch (error) {
      console.error('Erro Prisma addStock:', error);
      throw new BadRequestException('Erro interno ao registrar estoque. Verifique os dados enviados.');
    }
  }

  async getAllStock(tenantId: string) {
    return await this.prisma.medicationStock.findMany({
      where: { tenantId, deletedAt: null },
      include: { medication: true },
      orderBy: { validade: 'asc' }
    });
  }

  async getStockByMedication(tenantId: string, medicationId: string) {
    return await this.prisma.medicationStock.findMany({
      where: { tenantId, medicationId, deletedAt: null },
      orderBy: { validade: 'asc' }
    });
  }

  // 🔥 A MÁGICA: Trazemos o catálogo já calculando a soma total do estoque
  async getAllMedicationsCatalog(tenantId: string) {
    const meds = await this.prisma.medication.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        stocks: { where: { deletedAt: null } }
      },
      orderBy: { nome: 'asc' }
    });

    return meds.map(m => {
      // Soma todos os lotes que não foram deletados
      const totalStock = m.stocks.reduce((acc, curr) => acc + curr.quantidade, 0);
      // Remove a lista pesada de lotes para não sobrecarregar a rede do Frontend
      const { stocks, ...rest } = m;
      return { ...rest, totalStock };
    });
  }

  async createCatalogItem(tenantId: string, data: any) {
    try {
      return await this.prisma.medication.create({
        data: {
          id: crypto.randomUUID(),
          tenantId,
          nome: data.nome,
          principioAtivo: data.principioAtivo,
          formaFarmaceutica: data.formaFarmaceutica,
          viaAdministracaoPadrao: data.viaAdministracaoPadrao || 'ORAL',
          status: 'ATIVO'
        } as any
      });
    } catch (error) {
      console.error('Erro Prisma createCatalogItem:', error);
      throw new BadRequestException('Erro de validação ao salvar medicamento no catálogo.');
    }
  }
}