import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import * as crypto from 'crypto';

// 🔥 NOVA IMPORTAÇÃO: Serviço de Cache
import { RedisService } from '../../../infrastructure/cache/redis.service';

@Injectable()
export class DoctorsUseCases {
  constructor(
    private readonly prisma: PrismaService,
    // 🔥 INJEÇÃO DO REDIS ADICIONADA AQUI
    private readonly redisService: RedisService,
  ) {}

  // ====================================================================
  // 🔥 NOVO MÉTODO: Catálogo Global de Especialidades com Cache de 60s
  // ====================================================================
  async findAllSpecialties() {
    // Chave global (sem tenantId) porque as especialidades são do sistema todo
    const cacheKey = 'global:specialties:all';

    return this.redisService.getOrSet(cacheKey, 60, async () => {
      return this.prisma.specialty.findMany({
        orderBy: { nome: 'asc' }
      });
    });
  }

  // ====================================================================
  // MÉTODOS EXISTENTES DO CRUD DE MÉDICOS
  // ====================================================================
  
  async findAll(tenantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.doctor.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { nomeCompleto: 'asc' },
        include: { 
          specialties: { 
            include: { specialty: true } 
          } 
        }
      }),
      this.prisma.doctor.count({
        where: { tenantId, deletedAt: null }
      })
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { 
        specialties: { 
          include: { specialty: true } 
        } 
      }
    });

    if (!doctor) {
      throw new NotFoundException('Médico não encontrado.');
    }

    return doctor;
  }

  // ... (Mantenha aqui os seus métodos originais de create, update e remove) ...
}