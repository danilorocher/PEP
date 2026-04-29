import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { CreateDispensationDto } from '../../../../modules/pharmacy/dto/pharmacy.dto';
import { KardexAction } from '@prisma/client';

@Injectable()
export class PharmacyDispensationUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async dispense(tenantId: string, userId: string, data: CreateDispensationDto) {
    // 1. Validar a prescrição e obter o paciente
    const prescription = await this.prisma.prescription.findFirst({
      where: { id: data.prescriptionId, tenantId, deletedAt: null },
      include: { medicalRecord: true }
    });

    if (!prescription) throw new NotFoundException('Prescrição não encontrada ou inativa.');

    // 2. Transação ACID: Ou dispensa tudo e baixa o estoque, ou falha tudo
    return await this.prisma.$transaction(async (tx) => {
      
      const dispensation = await tx.medicationDispensation.create({
        data: {
          tenantId,
          prescriptionId: data.prescriptionId,
          farmaceuticoId: userId,
          status: 'DISPENSADA',
          dataHoraDispensa: new Date(),
          observacoes: data.observacoes,
        }
      });

      for (const item of data.items) {
        // Verifica o estoque
        const stock = await tx.medicationStock.findFirst({
          where: { id: item.stockId, tenantId, deletedAt: null }
        });

        if (!stock || stock.quantidade < item.quantidadeDispensada) {
          throw new BadRequestException(`Estoque insuficiente no lote selecionado.`);
        }

        // Baixa no estoque
        await tx.medicationStock.update({
          where: { id: item.stockId },
          data: { quantidade: stock.quantidade - item.quantidadeDispensada }
        });

        // Relaciona a dispensação ao item prescrito e ao lote
        await tx.dispensationItem.create({
          data: {
            dispensationId: dispensation.id,
            prescriptionItemId: item.prescriptionItemId,
            stockId: item.stockId,
            quantidadeDispensada: item.quantidadeDispensada
          }
        });

        // Registra no Kardex Hospitalar (Rastreabilidade)
        await tx.medicationKardex.create({
          data: {
            tenantId,
            patientId: prescription.medicalRecord.patientId,
            medicalRecordId: prescription.medicalRecordId,
            medicationId: stock.medicationId,
            responsavelId: userId,
            acao: KardexAction.DISPENSADO,
            detalhes: `Dispensação Validada: ${item.quantidadeDispensada} unid. | Lote: ${stock.lote} | Local: ${stock.localizacao}`,
          }
        });
      }

      return dispensation;
    });
  }
  
  async getPendingPrescriptions(tenantId: string) {
      return await this.prisma.prescription.findMany({
          where: { tenantId, status: 'ATIVA', deletedAt: null },
          include: {
              items: {
                  include: { medication: { select: { nome: true, formaFarmaceutica: true } } }
              },
              medicalRecord: { include: { patient: { select: { nomeCompleto: true } } } },
              prescritor: { select: { nomeCompleto: true } }
          },
          orderBy: { dataHora: 'desc' }
      });
  }
}