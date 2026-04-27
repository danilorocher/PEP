import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IBedRepository, BED_REPOSITORY_TOKEN } from '../../../domain/repositories/bed.repository.interface';
import { Bed } from '../../../domain/entities/bed.entity';
import * as crypto from 'crypto';
import { CreateBedDto, UpdateBedDto } from '../../../../modules/beds/dto/bed.dto';

@Injectable()
export class BedsUseCases {
  constructor(
    @Inject(BED_REPOSITORY_TOKEN) private readonly bedRepo: IBedRepository,
  ) {}

  async create(tenantId: string, data: CreateBedDto): Promise<Bed> {
    const exists = await this.bedRepo.checkNumeroExists(data.numero, data.wardId, tenantId);
    if (exists) throw new BadRequestException('Número de leito já existe nesta Ala.');

    const newBed = new Bed(
      crypto.randomUUID(), tenantId, data.wardId, data.numero, data.tipo,
      data.status || 'LIVRE', new Date(), new Date(), null
    );
    return this.bedRepo.create(newBed);
  }

  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.bedRepo.findAll(tenantId, skip, limit);
    return { data, total, page, limit };
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
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.bedRepo.softDelete(id, tenantId);
  }
}