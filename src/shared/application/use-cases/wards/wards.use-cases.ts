import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IWardRepository, WARD_REPOSITORY_TOKEN } from '../../../domain/repositories/ward.repository.interface';
import { Ward } from '../../../domain/entities/ward.entity';
import * as crypto from 'crypto';
import { CreateWardDto, UpdateWardDto } from '../../../../modules/wards/dto/ward.dto';

@Injectable()
export class WardsUseCases {
  constructor(
    @Inject(WARD_REPOSITORY_TOKEN) private readonly wardRepo: IWardRepository,
  ) {}

  async create(tenantId: string, data: CreateWardDto): Promise<Ward> {
    const newWard = new Ward(
      crypto.randomUUID(), tenantId, data.nome, data.tipo, data.capacidade,
      data.andar || null, data.status || 'ATIVO', new Date(), new Date(), null
    );
    return this.wardRepo.create(newWard);
  }

  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.wardRepo.findAll(tenantId, skip, limit);
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Ward> {
    const ward = await this.wardRepo.findById(id, tenantId);
    if (!ward) throw new NotFoundException('Ala não encontrada.');
    return ward;
  }

  async update(id: string, tenantId: string, data: UpdateWardDto): Promise<void> {
    const ward = await this.findOne(id, tenantId);
    const updatedWard = new Ward(
      ward.id, ward.tenantId, data.nome || ward.nome, data.tipo || ward.tipo,
      data.capacidade !== undefined ? data.capacidade : ward.capacidade,
      data.andar !== undefined ? data.andar : ward.andar,
      data.status || ward.status, ward.createdAt, new Date(), ward.deletedAt
    );
    await this.wardRepo.update(updatedWard);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.wardRepo.softDelete(id, tenantId);
  }

  async getOccupancyRates(tenantId: string) {
    return this.wardRepo.getOccupancyRates(tenantId);
  }

  async getBedsByWard(wardId: string, tenantId: string) {
    await this.findOne(wardId, tenantId); // Garante que a ala existe
    return this.wardRepo.findBedsByWard(wardId, tenantId);
  }
}