import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSpecialtyDto) {
    // 🔥 CORREÇÃO: Agora passamos o tenantId para cumprir o contrato do banco
    return this.prisma.specialty.create({ 
      data: { 
        ...dto, 
        tenantId 
      } 
    });
  }

  async findAll(tenantId: string) {
    // 🔥 CORREÇÃO: Filtramos para retornar apenas especialidades deste hospital
    return this.prisma.specialty.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    });
  }

  async remove(id: string) {
    return this.prisma.specialty.delete({ where: { id } });
  }
}