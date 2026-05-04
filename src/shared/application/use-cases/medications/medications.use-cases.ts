import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import * as crypto from 'crypto';

// 🔥 IMPORTAÇÃO DO REDIS
import { RedisService } from '../../../infrastructure/cache/redis.service';

@Injectable()
export class MedicationsUseCases {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService, // 🔥 INJEÇÃO DO CACHE
  ) {}

  async create(tenantId: string, data: any) {
    const newMedication = await this.prisma.medication.create({
      data: {
        id: crypto.randomUUID(),
        tenantId,
        nome: data.nome,
        principioAtivo: data.principioAtivo,
        concentracao: data.concentracao,
        formaFarmaceutica: data.formaFarmaceutica,
        fabricante: data.fabricante,
        codigoInterno: data.codigoInterno,
        codigoEAN: data.codigoEAN,
        controleEspecial: data.controleEspecial || false,
        status: data.status || 'ATIVO',
      } as any // 🔥 Resolve a tipagem estrita de relações do Prisma
    });

    return newMedication;
  }

  // 🔥 CACHE DE 60 SEGUNDOS APLICADO AQUI (Apenas Leitura do Catálogo)
  async findAll(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    // Chave única no Redis por clínica (tenant) e por página
    const cacheKey = `tenant:${tenantId}:medications:catalog:page:${page}:limit:${limit}`;

    return this.redisService.getOrSet(cacheKey, 60, async () => {
      const [data, total] = await Promise.all([
        this.prisma.medication.findMany({
          where: { tenantId, deletedAt: null },
          skip,
          take: limit,
          orderBy: { nome: 'asc' }
        }),
        this.prisma.medication.count({
          where: { tenantId, deletedAt: null }
        })
      ]);

      return { data, total, page, limit };
    });
  }

  async findOne(id: string, tenantId: string) {
    const medication = await this.prisma.medication.findFirst({
      where: { id, tenantId, deletedAt: null }
    });

    if (!medication) {
      throw new NotFoundException('Medicamento não encontrado no catálogo.');
    }

    return medication;
  }

  async update(id: string, tenantId: string, data: any) {
    const medication = await this.findOne(id, tenantId);

    const updated = await this.prisma.medication.update({
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
      } as any // 🔥 Resolve a tipagem estrita de relações do Prisma
    });

    return updated;
  }

  async remove(id: string, tenantId: string) {
    const medication = await this.findOne(id, tenantId);

    await this.prisma.medication.update({
      where: { id: medication.id },
      data: { deletedAt: new Date() }
    });
  }
}