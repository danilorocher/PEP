import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IUserRepository } from '../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): User {
    if (!record) return null;
    return new User(
      record.id, record.tenantId, record.roleId, record.nomeCompleto, record.cpf, record.email,
      record.isActive, record.mustChangePassword, record.dataNascimento, record.sexo,
      record.telefone, record.enderecoCompleto, record.dataAdmissao,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { id, tenantId, deletedAt: null } });
    // Retorna o record puro com a senha APENAS se for usado no UseCase interno (Login). O Domínio omite.
    if (!record) return null;
    const domainUser = this.toDomain(record);
    (domainUser as any).password = record.password; 
    return domainUser;
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { email, tenantId, deletedAt: null } });
    if (!record) return null;
    const domainUser = this.toDomain(record);
    (domainUser as any).password = record.password;
    return domainUser;
  }

  async findByCpf(cpf: string, tenantId: string): Promise<User | null> {
    const record = await this.prisma.user.findFirst({ where: { cpf, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number): Promise<{ data: User[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where: { tenantId, deletedAt: null }, skip, take }),
      this.prisma.user.count({ where: { tenantId, deletedAt: null } })
    ]);
    return { data: data.map(r => this.toDomain(r)), total };
  }

  async save(user: User, passwordHash?: string): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id, tenantId: user.tenantId, roleId: user.roleId, nomeCompleto: user.nomeCompleto,
        cpf: user.cpf, email: user.email, password: passwordHash || '', isActive: user.isActive,
        mustChangePassword: user.mustChangePassword, dataNascimento: user.dataNascimento,
        sexo: user.sexo as any, telefone: user.telefone, enderecoCompleto: user.enderecoCompleto,
        dataAdmissao: user.dataAdmissao
      },
    });
  }

  async update(user: User, passwordHash?: string): Promise<void> {
    const dataToUpdate: any = {
      roleId: user.roleId, nomeCompleto: user.nomeCompleto, cpf: user.cpf, email: user.email,
      isActive: user.isActive, mustChangePassword: user.mustChangePassword, dataNascimento: user.dataNascimento,
      sexo: user.sexo as any, telefone: user.telefone, enderecoCompleto: user.enderecoCompleto,
      dataAdmissao: user.dataAdmissao
    };
    if (passwordHash) dataToUpdate.password = passwordHash;

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