import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IRoleRepository } from '../../../../domain/repositories/role.repository.interface';
import { Role } from '../../../../domain/entities/role.entity';

@Injectable()
export class PrismaRoleRepository implements IRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Role {
    if (!record) return null;
    return new Role(
      record.id, record.tenantId, record.nome, record.permissoes,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(role: Role): Promise<Role> {
    const created = await this.prisma.role.create({
      data: {
        id: role.id,
        tenantId: role.tenantId,
        nome: role.nome,
        permissoes: role.permissoes,
      },
    });
    return this.toDomain(created);
  }

  async findAll(tenantId: string): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      where: { tenantId, deletedAt: null },
    });
    return roles.map(this.toDomain);
  }

  async findById(id: string, tenantId: string): Promise<Role | null> {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return this.toDomain(role);
  }

  async update(role: Role): Promise<Role> {
    const updated = await this.prisma.role.update({
      where: { id: role.id },
      data: {
        nome: role.nome,
        permissoes: role.permissoes,
      },
    });
    return this.toDomain(updated);
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.role.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }
}