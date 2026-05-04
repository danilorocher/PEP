import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBillingRepository, BILLING_REPOSITORY_TOKEN } from '../../../domain/repositories/billing.repository.interface';
import { BillingGuide } from '../../../domain/entities/billing-guide.entity';
import { BillingItem } from '../../../domain/entities/billing-item.entity';
import { CreateBillingGuideDto, BillingGuideStatus, UpdateBillingGuideStatusDto } from '../../../../modules/billing/dto/billing-guide.dto';
import { GlossItemDto } from '../../../../modules/billing/dto/billing-item.dto';
import * as crypto from 'crypto';

// 🔥 Importações para Paginação Universal
import { QueryBillingGuidesDto } from '../../../../modules/billing/dto/query-billing.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class BillingUseCases {
  constructor(
    @Inject(BILLING_REPOSITORY_TOKEN)
    private readonly billingRepo: IBillingRepository
  ) {}

  async createGuide(tenantId: string, data: CreateBillingGuideDto) {
    const guideId = crypto.randomUUID();
    let total = 0;

    const items = data.items.map((item) => {
      const itemId = crypto.randomUUID();
      const itemTotal = item.quantidade * item.valorUnitario;
      total += itemTotal;

      return new BillingItem(
        itemId, guideId, item.procedimentoDescricao, item.codigoTUSS,
        item.quantidade, item.valorUnitario, itemTotal, 'AUTORIZADO',
        item.examId, item.medicationId
      );
    });

    const guide = new BillingGuide(
      guideId, tenantId, data.patientId, data.convenioId, data.tipo,
      BillingGuideStatus.RASCUNHO, data.hospitalizationId, data.appointmentId,
      data.numeroGuia, new Date(), null, null, total, data.observacoes
    );

    return this.billingRepo.create(guide, items);
  }

  async getGuide(id: string, tenantId: string) {
    const guide = await this.billingRepo.findById(id, tenantId);
    if (!guide) throw new NotFoundException('Guia de faturamento não encontrada.');
    return guide;
  }

  // 🔥 Refatorado para usar Paginação Universal
  async listGuides(tenantId: string, query: QueryBillingGuidesDto) {
    const { page, limit, convenioId, status, startDate, endDate } = query;
    const { skip, take } = buildPaginationQuery(page, limit);

    const filters = {
      convenioId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const { data, total } = await this.billingRepo.findAll(tenantId, skip, take, filters);
    
    return buildPaginatedResult(data, total, page, limit);
  }

  async submitGuide(id: string, tenantId: string) {
    const guide = await this.getGuide(id, tenantId);
    if (guide.status !== BillingGuideStatus.RASCUNHO) {
      throw new BadRequestException('Apenas guias em RASCUNHO podem ser enviadas.');
    }
    await this.billingRepo.updateStatus(id, tenantId, BillingGuideStatus.ENVIADA);
  }

  async authorizeGuide(id: string, tenantId: string, data: UpdateBillingGuideStatusDto) {
    const guide = await this.getGuide(id, tenantId);
    if (guide.status !== BillingGuideStatus.ENVIADA) {
      throw new BadRequestException('Apenas guias ENVIADAS podem ser processadas.');
    }

    if (data.status === BillingGuideStatus.AUTORIZADA && (!data.dataAutorizacao || !data.codigoAutorizacao)) {
      throw new BadRequestException('Data e código de autorização são obrigatórios para status AUTORIZADA.');
    }

    await this.billingRepo.updateStatus(
      id, tenantId, data.status,
      data.dataAutorizacao ? new Date(data.dataAutorizacao) : undefined,
      data.codigoAutorizacao
    );
  }

  async glossItem(guideId: string, itemId: string, tenantId: string, data: GlossItemDto) {
    const guide = await this.getGuide(guideId, tenantId);
    const item = guide.items.find((i) => i.id === itemId);

    if (!item) throw new NotFoundException('Item da guia não encontrado.');

    await this.billingRepo.updateItemStatus(itemId, 'GLOSADO', data.motivoGlosa);
    
    const allItemsGlossed = guide.items.every(i => i.id === itemId || i.status === 'GLOSADO');
    if (allItemsGlossed) {
      await this.billingRepo.updateStatus(guideId, tenantId, BillingGuideStatus.GLOSADA);
    }
  }
}