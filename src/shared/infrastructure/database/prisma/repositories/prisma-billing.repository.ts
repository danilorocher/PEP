import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IBillingRepository } from '../../../../domain/repositories/billing.repository.interface';
import { BillingGuide } from '../../../../domain/entities/billing-guide.entity';
import { BillingItem } from '../../../../domain/entities/billing-item.entity';

@Injectable()
export class PrismaBillingRepository implements IBillingRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toGuideDomain(record: any): BillingGuide {
    return new BillingGuide(
      record.id, record.tenantId, record.patientId, record.convenioId,
      record.tipo, record.status, record.hospitalizationId, record.appointmentId,
      record.numeroGuia, record.dataEmissao, record.dataAutorizacao,
      record.codigoAutorizacao, record.valorTotal, record.observacoes,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  private toItemDomain(record: any): BillingItem {
    return new BillingItem(
      record.id, record.billingGuideId, record.procedimentoDescricao,
      record.codigoTUSS, record.quantidade, record.valorUnitario,
      record.valorTotal, record.status, record.examId, record.medicationId,
      record.motivoGlosa, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(guide: BillingGuide, items: BillingItem[]): Promise<BillingGuide> {
    const created = await this.prisma.$transaction(async (tx) => {
      const g = await tx.billingGuide.create({
        data: {
          id: guide.id, tenantId: guide.tenantId, patientId: guide.patientId,
          convenioId: guide.convenioId, tipo: guide.tipo as any,
          status: guide.status as any, hospitalizationId: guide.hospitalizationId,
          appointmentId: guide.appointmentId, numeroGuia: guide.numeroGuia,
          observacoes: guide.observacoes, valorTotal: guide.valorTotal,
        },
      });

      await tx.billingItem.createMany({
        data: items.map((item) => ({
          id: item.id, billingGuideId: g.id, procedimentoDescricao: item.procedimentoDescricao,
          codigoTUSS: item.codigoTUSS, quantidade: item.quantidade,
          valorUnitario: item.valorUnitario, valorTotal: item.valorTotal,
          status: item.status as any, examId: item.examId, medicationId: item.medicationId,
        })),
      });

      return g;
    });

    return this.toGuideDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<(BillingGuide & { items: BillingItem[] }) | null> {
    const record = await this.prisma.billingGuide.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } },
    });

    if (!record) return null;

    const guide = this.toGuideDomain(record);
    const items = record.items.map((item) => this.toItemDomain(item));

    return Object.assign(guide, { items });
  }

  // 🔥 Implementação atualizada para suportar os filtros universais
  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: BillingGuide[]; total: number }> {
    const where: any = {
      tenantId,
      deletedAt: null,
      ...(filters?.convenioId && { convenioId: filters.convenioId }),
      ...(filters?.status && { status: filters.status as any }),
      ...((filters?.startDate || filters?.endDate) && {
        dataEmissao: {
          ...(filters?.startDate && { gte: new Date(filters.startDate) }),
          ...(filters?.endDate && { lte: new Date(filters.endDate) }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.billingGuide.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.billingGuide.count({ where }),
    ]);

    return {
      data: data.map((record) => this.toGuideDomain(record)),
      total,
    };
  }

  async updateStatus(id: string, tenantId: string, status: string, dataAutorizacao?: Date, codigoAutorizacao?: string): Promise<void> {
    await this.prisma.billingGuide.update({
      where: { id, tenantId },
      data: {
        status: status as any,
        ...(dataAutorizacao && { dataAutorizacao }),
        ...(codigoAutorizacao && { codigoAutorizacao }),
      },
    });
  }

  async updateItemStatus(itemId: string, status: string, motivoGlosa?: string): Promise<void> {
    await this.prisma.billingItem.update({
      where: { id: itemId },
      data: {
        status: status as any,
        ...(motivoGlosa && { motivoGlosa }),
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.billingGuide.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }
}