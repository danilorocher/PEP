import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { GenerateSUSBillingDto, RegisterDenialDto, AssignDRGDto } from '../../../../modules/hospital-billing/dto/hospital-billing.dto';

@Injectable()
export class HospitalBillingUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(tenantId: string, status?: string) {
    return await this.prisma.hospitalAccount.findMany({
      where: { tenantId, deletedAt: null, ...(status && { status: status as any }) },
      include: {
        patient: { select: { nomeCompleto: true, cpf: true } },
        drgGroup: true,
        _count: { select: { items: true, denials: { where: { status: 'OPEN' } } } }
      },
      orderBy: { openedAt: 'desc' }
    });
  }

  async getAccountDetails(tenantId: string, accountId: string) {
    const account = await this.prisma.hospitalAccount.findFirst({
      where: { id: accountId, tenantId, deletedAt: null },
      include: {
        items: { orderBy: { timestamp: 'desc' } },
        susBillings: true,
        denials: true,
        patient: true,
        drgGroup: true
      }
    });
    if (!account) throw new NotFoundException('Conta hospitalar não encontrada.');
    return account;
  }

  async closeAccount(tenantId: string, accountId: string) {
    const account = await this.prisma.hospitalAccount.findFirst({ where: { id: accountId, tenantId } });
    if (!account || account.status !== 'OPEN') throw new BadRequestException('A conta não está aberta para fecho.');

    return await this.prisma.hospitalAccount.update({
      where: { id: accountId },
      data: { status: 'CLOSED', closedAt: new Date() }
    });
  }

  // --- FATURAMENTO SUS ---
  async generateSUSBilling(tenantId: string, accountId: string, data: GenerateSUSBillingDto) {
    // 🔥 CORREÇÃO: Como a injeção via construtor é apenas o PrismaService, usamos ele!
    const account = await this.prisma.hospitalAccount.findFirst({
      where: { id: accountId, tenantId, deletedAt: null }
    });
    
    if (!account) throw new NotFoundException('Conta hospitalar não encontrada.');
    if (account.status === 'OPEN') throw new BadRequestException('A conta deve ser fechada antes de faturar.');

    await this.prisma.hospitalAccount.update({
      where: { id: accountId },
      data: { status: 'BILLED', billingDate: new Date() }
    });

    const protocolNumber = `${data.type}-${Date.now()}`;

    return await this.prisma.sUSBilling.create({
      data: {
        tenantId,
        accountId,
        type: data.type,
        status: 'GENERATED',
        protocolNumber,
        submissionDate: new Date()
      }
    });
  }

  // --- GESTÃO DE GLOSAS ---
  async registerDenial(tenantId: string, accountId: string, data: RegisterDenialDto) {
    await this.prisma.hospitalAccount.update({
      where: { id: accountId },
      data: { status: 'DENIED' }
    });

    return await this.prisma.billingDenial.create({
      data: {
        tenantId,
        accountId,
        reason: data.reason,
        amountDenied: data.amountDenied,
        status: 'OPEN'
      }
    });
  }

  // --- DRG (Diagnosis Related Groups) ---
  async assignDRG(tenantId: string, accountId: string, data: AssignDRGDto) {
    // Upsert para reaproveitar DRG groups iguais na mesma clínica
    const drg = await this.prisma.dRGGroup.upsert({
      where: { tenantId_code: { tenantId, code: data.code } },
      update: { averageCost: data.averageCost, description: data.description },
      create: { tenantId, code: data.code, description: data.description, averageCost: data.averageCost }
    });

    return await this.prisma.hospitalAccount.update({
      where: { id: accountId },
      data: { drgGroupId: drg.id }
    });
  }
}