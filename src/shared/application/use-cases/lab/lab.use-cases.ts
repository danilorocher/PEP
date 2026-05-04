import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { LAB_REPOSITORY_TOKEN, ILabRepository } from '../../../domain/repositories/lab.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

@Injectable()
export class LabUseCases {
  constructor(
    @Inject(LAB_REPOSITORY_TOKEN) private readonly labRepo: ILabRepository,
    private readonly prisma: PrismaService, // 🔥 CORREÇÃO: Injeção do PrismaService
    @InjectQueue('lab-critical-alert') private readonly criticalQueue: Queue, // 🔥 Preparação para Parte 3
  ) {}

  async createOrder(tenantId: string, userId: string, data: any) {
    return this.labRepo.createOrder({ ...data, tenantId, requestedBy: userId }, data.examIds);
  }

  async getOrderDetails(tenantId: string, id: string) { // 🔥 CORREÇÃO: Método que faltava
    const order = await this.labRepo.findOrderById(id, tenantId);
    if (!order) throw new NotFoundException('Pedido não encontrado.');
    return order;
  }

  async collectSample(tenantId: string, userId: string, orderId: string, sampleType: string) {
    const barcode = `LAB-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const sample = await this.labRepo.createSample({
      tenantId, labOrderId: orderId, sampleType, barcode,
      collectedBy: userId, collectedAt: new Date(), status: 'COLLECTED'
    });
    await this.labRepo.updateOrderStatus(orderId, 'COLLECTED');
    return sample;
  }

  async processResult(tenantId: string, userId: string, resultId: string, value: string) {
    const resultRecord = await this.prisma.labResult.findUnique({ 
      where: { id: resultId },
      include: { exam: true, order: { include: { patient: true } } } 
    });

    if (!resultRecord) throw new NotFoundException('Resultado não encontrado.');

    const numericValue = parseFloat(value.replace(',', '.'));
    const isCritical = !isNaN(numericValue) && 
      ((resultRecord.exam.criticalMin && numericValue <= resultRecord.exam.criticalMin) || 
       (resultRecord.exam.criticalMax && numericValue >= resultRecord.exam.criticalMax));

    const updatedResult = await this.labRepo.updateResult(resultId, {
      value,
      numericValue: !isNaN(numericValue) ? numericValue : null,
      isCritical,
      releasedBy: userId,
      releasedAt: new Date()
    });

    // Se crítico, dispara alerta para o médico via BullMQ
    if (isCritical) {
      await this.criticalQueue.add('critical-alert', {
        tenantId,
        patientName: resultRecord.order.patient.nomeCompleto,
        examName: resultRecord.exam.name,
        value: value,
        limit: numericValue <= resultRecord.exam.criticalMin ? resultRecord.exam.criticalMin : resultRecord.exam.criticalMax
      });
    }

    return updatedResult;
  }

  async signReport(tenantId: string, userId: string, orderId: string, reportText: string) {
    const report = await this.labRepo.upsertReport({
      tenantId, labOrderId: orderId, reportText, signedBy: userId, signedAt: new Date()
    });
    await this.labRepo.updateOrderStatus(orderId, 'COMPLETED');
    return report;
  }
}