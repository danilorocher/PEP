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

      // 1. Verifica se já existe esse Lote para esse Medicamento neste local
      const estoqueExistente = await this.prisma.medicationStock.findFirst({
        where: {
          tenantId,
          medicationId: data.medicationId,
          lote: data.lote,
          localizacao: localizacaoFinal
        }
      });

      // 2. Se o Lote já existe, apenas SOMA a nova quantidade (Update)
      if (estoqueExistente) {
        return await this.prisma.medicationStock.update({
          where: { id: estoqueExistente.id },
          data: {
            quantidade: estoqueExistente.quantidade + quantidadeAdd
          }
        });
      }

      // 3. Se não existe, cria um registro novo no banco de dados
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

  // --- Funções de Consulta e Catálogo abaixo ---
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

  async getAllMedicationsCatalog(tenantId: string) {
    return await this.prisma.medication.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, nome: true, principioAtivo: true, concentracao: true, formaFarmaceutica: true },
      orderBy: { nome: 'asc' }
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
          // 🔥 Aqui está a nossa correção que garante a validação
          viaAdministracaoPadrao: data.viaAdministracaoPadrao || 'ORAL',
          status: 'ATIVO'
        } as any
      });
    } catch (error) {
      console.error('Erro Prisma createCatalogItem:', error);
      throw new BadRequestException('Erro de validação ao salvar medicamento no catálogo.');
    }
  }
} // <-- Esta foi a chave que se perdeu anteriormente!