import { Inject, Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IFinancialTransactionRepository, FINANCIAL_TRANSACTION_REPOSITORY_TOKEN } from '../../../domain/repositories/financial-transaction.repository.interface';
import { IChartOfAccountsRepository, CHART_OF_ACCOUNTS_REPOSITORY_TOKEN } from '../../../domain/repositories/chart-of-accounts.repository.interface';
import { ICostCenterRepository, COST_CENTER_REPOSITORY_TOKEN } from '../../../domain/repositories/cost-center.repository.interface';
import { FinancialTransaction } from '../../../domain/entities/financial-transaction.entity';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class FinancialTransactionUseCases {
  constructor(
    @Inject(FINANCIAL_TRANSACTION_REPOSITORY_TOKEN) private readonly repo: IFinancialTransactionRepository,
    @Inject(CHART_OF_ACCOUNTS_REPOSITORY_TOKEN) private readonly chartRepo: IChartOfAccountsRepository,
    @Inject(COST_CENTER_REPOSITORY_TOKEN) private readonly costCenterRepo: ICostCenterRepository
  ) {}

  async create(tenantId: string, userId: string, data: any): Promise<FinancialTransaction> {
    const chartAccount = await this.chartRepo.findById(data.chartAccountId, tenantId);
    if (!chartAccount) throw new BadRequestException('Conta contábil inválida ou não pertence ao hospital.');
    if (!chartAccount.aceitaLancamento) throw new BadRequestException('Esta conta contábil não aceita lançamentos diretos (conta sintética).');

    if (data.costCenterId) {
      const costCenter = await this.costCenterRepo.findById(data.costCenterId, tenantId);
      if (!costCenter) throw new BadRequestException('Centro de custo inválido.');
    }

    // 🔥 BLINDAGEM: Conversão de Valor
    const valorTratado = Number(data.valor);
    if (isNaN(valorTratado) || valorTratado <= 0) {
      throw new BadRequestException('Valor da transação financeiro é inválido.');
    }

    // 🔥 BLINDAGEM: Conversão de Datas
    const dataComp = new Date(data.dataCompetencia);
    if (isNaN(dataComp.getTime())) {
      throw new BadRequestException('Data de competência enviada é inválida.');
    }
    const dataVenc = data.dataVencimento ? new Date(data.dataVencimento) : null;

    const entity = new FinancialTransaction(
      crypto.randomUUID(), tenantId, data.tipo, data.natureza, data.chartAccountId,
      data.costCenterId || null, data.descricao, valorTratado, dataComp,
      dataVenc, null, 'PENDENTE',
      data.origemTipo || null, data.origemId || null, data.numeroDocumento || null,
      data.formaPagamento || null, data.observacoes || null, userId, null, null,
      new Date(), new Date(), null
    );

    return this.repo.save(entity);
  }

  async findAll(tenantId: string, query: any) {
    const { page, limit, tipo, status, natureza, chartAccountId, costCenterId, dataCompetenciaStart, dataCompetenciaEnd } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    
    const filters = { tipo, status, natureza, chartAccountId, costCenterId, dataCompetenciaStart, dataCompetenciaEnd };
    const { data, total } = await this.repo.findAll(tenantId, skip, take, filters);
    
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string, tenantId: string): Promise<FinancialTransaction> {
    const record = await this.repo.findById(id, tenantId);
    if (!record) throw new NotFoundException('Lançamento financeiro não encontrado.');
    return record;
  }

  async approve(id: string, tenantId: string, userId: string): Promise<void> {
    const tx = await this.findOne(id, tenantId);
    if (tx.status !== 'PENDENTE') throw new BadRequestException('Apenas lançamentos PENDENTES podem ser aprovados.');
    
    // Regra Enterprise 4-Eyes Principle
    if (tx.criadoPorId === userId) {
      throw new ForbiddenException('Princípio dos Quatro Olhos: O criador do lançamento não pode ser o mesmo a aprová-lo.');
    }

    await this.repo.updateStatus(id, tenantId, 'APROVADO', { aprovadoPorId: userId, aprovadoEm: new Date() });
  }

  async pay(id: string, tenantId: string, data: any): Promise<void> {
    const tx = await this.findOne(id, tenantId);
    if (tx.status === 'CANCELADO' || tx.status === 'PAGO') throw new BadRequestException('Lançamento já está pago ou cancelado.');
    if (!data.dataPagamento || !data.formaPagamento) throw new BadRequestException('Data e Forma de pagamento são obrigatórios.');

    await this.repo.updateStatus(id, tenantId, 'PAGO', { 
      dataPagamento: new Date(data.dataPagamento), 
      formaPagamento: data.formaPagamento 
    });
  }

  async cancel(id: string, tenantId: string): Promise<void> {
    const tx = await this.findOne(id, tenantId);
    if (tx.status === 'PAGO') throw new BadRequestException('Não é possível cancelar um lançamento que já foi pago.');
    
    await this.repo.updateStatus(id, tenantId, 'CANCELADO');
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const tx = await this.findOne(id, tenantId);
    if (tx.status !== 'PENDENTE') throw new BadRequestException('Apenas lançamentos PENDENTES podem ser excluídos.');
    
    await this.repo.softDelete(id, tenantId);
  }
}