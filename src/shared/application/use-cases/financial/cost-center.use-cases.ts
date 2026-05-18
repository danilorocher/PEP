import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ICostCenterRepository, COST_CENTER_REPOSITORY_TOKEN } from '../../../domain/repositories/cost-center.repository.interface';
import { CostCenter } from '../../../domain/entities/cost-center.entity';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class CostCenterUseCases {
  constructor(
    @Inject(COST_CENTER_REPOSITORY_TOKEN) private readonly repo: ICostCenterRepository
  ) {}

  async create(tenantId: string, data: any): Promise<CostCenter> {
    const existing = await this.repo.findByCode(data.codigo, tenantId);
    if (existing) throw new BadRequestException(`Centro de custo com código ${data.codigo} já existe.`);

    const entity = new CostCenter(
      crypto.randomUUID(), tenantId, data.codigo, data.nome, data.tipo,
      data.codigoPai || null, data.ativo ?? true, data.descricao || null,
      new Date(), new Date(), null
    );

    return this.repo.save(entity);
  }

  async findAll(tenantId: string, query: any) {
    const { page, limit, search, tipo, ativo } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    
    const filters = { search, tipo, ativo: ativo !== undefined ? String(ativo) === 'true' : undefined };
    const { data, total } = await this.repo.findAll(tenantId, skip, take, filters);
    
    return buildPaginatedResult(data, total, page, limit);
  }

  async findOne(id: string, tenantId: string): Promise<CostCenter> {
    const record = await this.repo.findById(id, tenantId);
    if (!record) throw new NotFoundException('Centro de custo não encontrado.');
    return record;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.repo.softDelete(id, tenantId);
  }
}