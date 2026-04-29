import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { CreateInteractionDto } from '../../../../modules/pharmacy/dto/pharmacy.dto';

@Injectable()
export class PharmacyInteractionUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async addInteractionRule(tenantId: string, data: CreateInteractionDto) {
    return await this.prisma.drugInteraction.create({
      data: { tenantId, ...data }
    });
  }

  // Recebe um array de IDs e retorna se existem interações cruzadas
  async checkInteractions(tenantId: string, medicationIds: string[]) {
    if (!medicationIds || medicationIds.length < 2) return [];

    return await this.prisma.drugInteraction.findMany({
      where: {
        tenantId,
        deletedAt: null,
        AND: [
          { medicationAId: { in: medicationIds } },
          { medicationBId: { in: medicationIds } }
        ]
      },
      include: {
        medicationA: { select: { nome: true } },
        medicationB: { select: { nome: true } }
      }
    });
  }
}