import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IUserRepository, UserWithPassword } from '../../../../domain/repositories/user.repository.interface';
import { User, Address } from '../../../../domain/entities/user.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): User | null {
    if (!record) return null;
    return new User(
      record.id, record.tenantId, record.roleId, record.nomeCompleto, record.cpf, record.email,
      record.isActive, record.mustChangePassword, record.dataNascimento, record.sexo,
      record.telefone, record.enderecoCompleto ? (record.enderecoCompleto as any as Address) : null, 
      record.dataAdmissao, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { email, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findAuthUserByEmail(email: string, tenantId: string): Promise<UserWithPassword | null> {
    const record = await this.prisma.user.findFirst({ where: { email, tenantId, deletedAt: null } });
    if (!record) return null;
    return { user: this.toDomain(record)!, passwordHash: record.password };
  }

  async findAuthUserById(id: string, tenantId: string): Promise<UserWithPassword | null> {
    const record = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!record) return null;
    return { user: this.toDomain(record)!, passwordHash: record.password };
  }

  async findByCpf(cpfHash: string, tenantId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { cpfHash, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: User[]; total: number }> {
    const where: Prisma.UserWhereInput = { tenantId, deletedAt: null };
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.roleId) where.roleId = filters.roleId;
    if (filters?.search) {
      where.OR = [
        { nomeCompleto: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take, orderBy: { nomeCompleto: 'asc' } }),
      this.prisma.user.count({ where })
    ]);
    return { data: data.map(r => this.toDomain(r)!), total };
  }

  async save(user: User, passwordHash: string, cpfHash?: string): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id, tenantId: user.tenantId, roleId: user.roleId, nomeCompleto: user.nomeCompleto,
        cpf: user.cpf, cpfHash: cpfHash, email: user.email, password: passwordHash || '', isActive: user.isActive,
        mustChangePassword: user.mustChangePassword, dataNascimento: user.dataNascimento,
        sexo: user.sexo as any, telefone: user.telefone, 
        enderecoCompleto: user.enderecoCompleto as any,
        dataAdmissao: user.dataAdmissao
      },
    });
  }

  async update(user: User, passwordHash?: string, cpfHash?: string): Promise<void> {
    const dataToUpdate: any = {
      roleId: user.roleId, nomeCompleto: user.nomeCompleto, cpf: user.cpf, email: user.email,
      isActive: user.isActive, mustChangePassword: user.mustChangePassword, dataNascimento: user.dataNascimento,
      sexo: user.sexo as any, telefone: user.telefone, 
      enderecoCompleto: user.enderecoCompleto as any,
      dataAdmissao: user.dataAdmissao
    };
    if (passwordHash) dataToUpdate.password = passwordHash;
    if (cpfHash) dataToUpdate.cpfHash = cpfHash;

    await this.prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}