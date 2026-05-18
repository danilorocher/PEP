import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IChartOfAccountsRepository, CHART_OF_ACCOUNTS_REPOSITORY_TOKEN } from '../../../domain/repositories/chart-of-accounts.repository.interface';
import { ChartOfAccounts } from '../../../domain/entities/chart-of-accounts.entity';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class ChartOfAccountsUseCases {
  constructor(
    @Inject(CHART_OF_ACCOUNTS_REPOSITORY_TOKEN) private readonly repo: IChartOfAccountsRepository
  ) {}

  async create(tenantId: string, data: any): Promise<ChartOfAccounts> {
    const existing = await this.repo.findByCode(data.codigo, tenantId);
    if (existing) throw new BadRequestException(`Conta contábil com código ${data.codigo} já existe.`);

    if (data.codigoPai) {
      const parent = await this.repo.findByCode(data.codigoPai, tenantId);
      if (!parent) throw new BadRequestException('Código pai informado não existe no plano de contas.');
    }

    const entity = new ChartOfAccounts(
      crypto.randomUUID(), tenantId, data.codigo, data.nome, data.tipo, data.natureza,
      data.codigoPai || null, data.aceitaLancamento ?? true, data.ativo ?? true,
      data.descricao || null, new Date(), new Date(), null
    );

    return this.repo.save(entity);
  }

  async findAll(tenantId: string, query: any) {
    const { page, limit, tipo, ativo, aceitaLancamento } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    
    const filters = { 
      tipo, 
      ativo: ativo !== undefined ? String(ativo) === 'true' : undefined,
      aceitaLancamento: aceitaLancamento !== undefined ? String(aceitaLancamento) === 'true' : undefined
    };

    const { data, total } = await this.repo.findAll(tenantId, skip, take, filters);
    return buildPaginatedResult(data, total, page, limit);
  }

  async getTree(tenantId: string) {
    // Retorna todas as contas ativas do tenant sem paginação para montar a árvore no Frontend
    const { data } = await this.repo.findAll(tenantId, 0, 10000, { ativo: true });
    
    // Função auxiliar recursiva para montar a árvore
    const buildTree = (parentId: string | null): any[] => {
      return data
        .filter(node => node.codigoPai === parentId)
        .map(node => ({
          ...node,
          key: node.id,
          title: `${node.codigo} - ${node.nome}`,
          children: buildTree(node.codigo)
        }));
    };

    return buildTree(null);
  }

  async findOne(id: string, tenantId: string): Promise<ChartOfAccounts> {
    const record = await this.repo.findById(id, tenantId);
    if (!record) throw new NotFoundException('Conta contábil não encontrada.');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    // Em uma versão mais restrita, injetaríamos o IFinancialTransactionRepository para verificar se a conta tem lançamentos.
    // Como softDelete mantém integridade, aplicamos diretamente nesta Fase 1.
    await this.repo.softDelete(id, tenantId);
  }
}