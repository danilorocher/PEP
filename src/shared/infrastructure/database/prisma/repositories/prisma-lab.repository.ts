import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ILabRepository } from '../../../../domain/repositories/lab.repository.interface';

@Injectable()
export class PrismaLabRepository implements ILabRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createExam(data: any) {
    return this.prisma.labExam.create({ data });
  }

  async findExamByCode(tenantId: string, code: string) {
    return this.prisma.labExam.findUnique({ where: { tenantId_code: { tenantId, code } } });
  }

  async createOrder(data: any, examIds: string[]) {
    return this.prisma.labOrder.create({
      data: {
        ...data,
        results: {
          create: examIds.map(examId => ({
            tenantId: data.tenantId,
            examId: examId,
            value: 'PENDENTE'
          }))
        }
      }
    });
  }

  async findOrderById(id: string, tenantId: string) {
    return this.prisma.labOrder.findFirst({
      where: { id, tenantId },
      include: { patient: true, results: { include: { exam: true } }, samples: true, report: true }
    });
  }

  async updateOrderStatus(id: string, status: any) {
    await this.prisma.labOrder.update({ where: { id }, data: { status } });
  }

  async createSample(data: any) {
    return this.prisma.labSample.create({ data });
  }

  async updateResult(id: string, data: any) {
    return this.prisma.labResult.update({ where: { id }, data });
  }

  async upsertReport(data: any) {
    return this.prisma.labReport.upsert({
      where: { labOrderId: data.labOrderId },
      update: data,
      create: data
    });
  }
}