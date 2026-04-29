import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { AddStockDto } from '../../../../modules/pharmacy/dto/pharmacy.dto';

@Injectable()
export class PharmacyStockUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async addStock(tenantId: string, data: AddStockDto) {
    return await this.prisma.medicationStock.create({
      data: {
        tenantId,
        medicationId: data.medicationId,
        lote: data.lote,
        validade: new Date(data.validade),
        quantidade: data.quantidade,
        localizacao: data.localizacao,
      }
    });
  }

  async getStockByMedication(tenantId: string, medicationId: string) {
    return await this.prisma.medicationStock.findMany({
      where: { tenantId, medicationId, deletedAt: null },
      orderBy: { validade: 'asc' }
    });
  }

  // 🔥 NOVA FUNÇÃO: Busca o catálogo base de medicamentos
  async getAllMedicationsCatalog(tenantId: string) {
    return await this.prisma.medication.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, nome: true, principioAtivo: true, concentracao: true, formaFarmaceutica: true },
      orderBy: { nome: 'asc' }
    });
  }
}