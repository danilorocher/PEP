import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { CreateOccupationDto } from './dto/create-occupation.dto';

@Injectable()
export class OccupationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateOccupationDto) {
    return this.prisma.occupation.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.occupation.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { nome: 'asc' },
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.occupation.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.occupation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}