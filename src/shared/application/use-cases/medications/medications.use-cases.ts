import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import * as crypto from 'crypto';
import { RedisService } from '../../../infrastructure/cache/redis.service';

// 🔥 Paginação
import { QueryMedicationsDto } from '../../../../modules/medications/dto/query-medications.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class MedicationsUseCases {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async create(tenantId: string, data: any) {
    return await this.prisma.medication.create({
      data: {
        id: crypto.randomUUID(), tenantId, nome: data.nome, principioAtivo: data.principioAtivo,
        concentracao: data.concentracao, formaFarmaceutica: data.formaFarmaceutica,
        fabricante: data.fabricante, codigoInterno: data.codigoInterno, codigoEAN: data.codigoEAN,
        controleEspecial: data.controleEspecial || false, status: data.status || 'ATIVO',
      } as any
    });
  }

  // 🔥 PAGINAÇÃO COM CACHE + FILTROS
  async findAll(tenantId: string, query: QueryMedicationsDto) {
    const { page, limit, search, formaFarmaceutica, controleEspecial } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    
    // Chave de cache precisa incluir os filtros para ser única
    const cacheKey = `tenant:${tenantId}:meds:page:${page}:lim:${limit}:s:${search || ''}:f:${formaFarmaceutica || ''}:c:${controleEspecial}`;

    return this.redisService.getOrSet(cacheKey, 60, async () => {
      const where: any = { tenantId, deletedAt: null };

      if (search) {
        where.OR = [
          { nome: { contains: search, mode: 'insensitive' } },
          { principioAtivo: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (formaFarmaceutica) where.formaFarmaceutica = formaFarmaceutica;
      if (controleEspecial !== undefined) where.controleEspecial = controleEspecial;

      const [data, total] = await Promise.all([
        this.prisma.medication.findMany({ where, skip, take, orderBy: { nome: 'asc' } }),
        this.prisma.medication.count({ where })
      ]);

      return buildPaginatedResult(data, total, page, limit);
    });
  }

  async findOne(id: string, tenantId: string) {
    const medication = await this.prisma.medication.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!medication) throw new NotFoundException('Medicamento não encontrado no catálogo.');
    return medication;
  }

  async update(id: string, tenantId: string, data: any) {
    const medication = await this.findOne(id, tenantId);
    return await this.prisma.medication.update({
      where: { id: medication.id },
      data: {
        nome: data.nome !== undefined ? data.nome : medication.nome,
        principioAtivo: data.principioAtivo !== undefined ? data.principioAtivo : medication.principioAtivo,
        concentracao: data.concentracao !== undefined ? data.concentracao : medication.concentracao,
        formaFarmaceutica: data.formaFarmaceutica !== undefined ? data.formaFarmaceutica : medication.formaFarmaceutica,
        fabricante: data.fabricante !== undefined ? data.fabricante : medication.fabricante,
        codigoInterno: data.codigoInterno !== undefined ? data.codigoInterno : medication.codigoInterno,
        codigoEAN: data.codigoEAN !== undefined ? data.codigoEAN : medication.codigoEAN,
        controleEspecial: data.controleEspecial !== undefined ? data.controleEspecial : medication.controleEspecial,
        status: data.status !== undefined ? data.status : medication.status,
      } as any
    });
  }

  async remove(id: string, tenantId: string) {
    const medication = await this.findOne(id, tenantId);
    await this.prisma.medication.update({
      where: { id: medication.id },
      data: { deletedAt: new Date() }
    });
  }
}