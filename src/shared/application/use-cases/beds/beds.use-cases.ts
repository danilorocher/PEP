import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBedRepository, BED_REPOSITORY_TOKEN } from '../../../domain/repositories/bed.repository.interface';
import { Bed } from '../../../domain/entities/bed.entity';
import * as crypto from 'crypto';
import { CreateBedDto, UpdateBedDto } from '../../../../modules/beds/dto/bed.dto';

// 🔥 NOVA IMPORTAÇÃO: Serviço de Cache
import { RedisService } from '../../../infrastructure/cache/redis.service';

@Injectable()
export class BedsUseCases {
  constructor(
    @Inject(BED_REPOSITORY_TOKEN) private readonly bedRepo: IBedRepository,
    // 🔥 INJEÇÃO DO REDIS ADICIONADA AQUI
    private readonly redisService: RedisService,
  ) {}

  async create(tenantId: string, data: CreateBedDto): Promise<Bed> {
    const exists = await this.bedRepo.checkNumeroExists(data.numero, data.wardId, tenantId);
    if (exists) throw new BadRequestException('Número de leito já existe nesta Ala.');

    const newBed = new Bed(
      crypto.randomUUID(), tenantId, data.wardId, data.numero, data.tipo,
      data.status || 'LIVRE', new Date(), new Date(), null
    );
    const createdBed = await this.bedRepo.create(newBed);

    // 🔥 Invalida o cache para atualizar a tela do hospital na hora
    await this.redisService.invalidate(`tenant:${tenantId}:beds:all:page:1:limit:10`);

    return createdBed;
  }

  // 🔥 CACHE DE 30 SEGUNDOS APLICADO AQUI
  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const cacheKey = `tenant:${tenantId}:beds:all:page:${page}:limit:${limit}`;

    return this.redisService.getOrSet(cacheKey, 30, async () => {
      const { data, total } = await this.bedRepo.findAll(tenantId, skip, limit);
      return { data, total, page, limit };
    });
  }

  async findAvailable(tenantId: string, tipo?: string, wardId?: string): Promise<Bed[]> {
    return this.bedRepo.findAvailable(tenantId, tipo, wardId);
  }

  async findOne(id: string, tenantId: string): Promise<Bed> {
    const bed = await this.bedRepo.findById(id, tenantId);
    if (!bed) throw new NotFoundException('Leito não encontrado.');
    return bed;
  }

  async update(id: string, tenantId: string, data: UpdateBedDto): Promise<void> {
    const bed = await this.findOne(id, tenantId);

    if (data.numero && data.wardId && (data.numero !== bed.numero || data.wardId !== bed.wardId)) {
      const exists = await this.bedRepo.checkNumeroExists(data.numero, data.wardId, tenantId);
      if (exists) throw new BadRequestException('Número de leito já existe nesta Ala.');
    }

    const updatedBed = new Bed(
      bed.id, bed.tenantId, data.wardId || bed.wardId, data.numero || bed.numero,
      data.tipo || bed.tipo, data.status || bed.status, bed.createdAt, new Date(), bed.deletedAt
    );
    await this.bedRepo.update(updatedBed);

    // 🔥 Invalida o cache (ex: quando enfermagem muda para LIMPEZA)
    await this.redisService.invalidate(`tenant:${tenantId}:beds:all:page:1:limit:10`);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.bedRepo.softDelete(id, tenantId);

    // 🔥 Invalida o cache
    await this.redisService.invalidate(`tenant:${tenantId}:beds:all:page:1:limit:10`);
  }
}