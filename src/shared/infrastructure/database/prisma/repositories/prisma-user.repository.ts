import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Mapeador auxiliar (Banco -> Domínio)
  private toDomain(record: any): User {
    if (!record) return null;
    return new User(
      record.id, record.tenantId, record.email, record.name, 
      record.role, record.isActive, record.createdAt, record.updatedAt
    );
  }

  async findById(id: string, tenantId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, tenantId },
    });
    return this.toDomain(user);
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email_tenantId: { email, tenantId } },
    });
    return this.toDomain(user);
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.create({
      data: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        password: 'hash_pendente', // Trataremos no módulo Auth
        name: user.name,
        // @ts-ignore - Para o exemplo rápido, mapeando a role
        role: user.role, 
        isActive: user.isActive,
      },
    });
  }
}