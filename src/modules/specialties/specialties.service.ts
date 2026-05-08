import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSpecialtyDto) {
    return this.prisma.specialty.create({ data: dto });
  }

  async findAll() {
    return this.prisma.specialty.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async remove(id: string) {
    return this.prisma.specialty.delete({ where: { id } });
  }
}