import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { CreateInsuranceDto, UpdateInsuranceDto } from './dto/insurance.dto';

@Injectable()
export class InsurancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, data: CreateInsuranceDto) {
    const existing = await this.prisma.insurance.findFirst({
      where: { nome: data.nome, tenantId, deletedAt: null }
    });
    if (existing) throw new ConflictException('Já existe um convênio cadastrado com este nome.');

    return this.prisma.insurance.create({
      data: { ...data, tenantId }
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.insurance.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { nome: 'asc' }
    });
  }

  async findOne(id: string, tenantId: string) {
    const insurance = await this.prisma.insurance.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!insurance) throw new NotFoundException('Convênio não encontrado.');
    return insurance;
  }

  async update(id: string, tenantId: string, data: UpdateInsuranceDto) {
    await this.findOne(id, tenantId); // Valida se existe
    return this.prisma.insurance.update({
      where: { id },
      data
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.insurance.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INATIVO' }
    });
  }
}