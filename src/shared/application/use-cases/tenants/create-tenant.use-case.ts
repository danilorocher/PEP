import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { EncryptionService } from '../../../infrastructure/database/prisma/repositories/services/encryption.service';
import * as bcrypt from 'bcryptjs';
import { PlanType } from '@prisma/client';
import { CreateTenantDto } from '../../../../modules/tenants/dto/create-tenant.dto';

@Injectable()
export class CreateTenantUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService
  ) {}

  async execute(dto: CreateTenantDto) {
    const existingTenant = await this.prisma.tenant.findUnique({ where: { subdomain: dto.subdomain } });
    if (existingTenant) throw new BadRequestException('Subdomínio já em uso.');

    const encryptedCpf = this.encryption.encrypt(dto.adminCpf);
    const cpfHash = this.encryption.hash(dto.adminCpf);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Cria a Empresa
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          subdomain: dto.subdomain,
          cnpj: dto.cnpj,
          plano: PlanType.STANDARD,
          isActive: true
        }
      });

      // 2. Cria a Role MASTER com todas as permissões
      const superPermissions = {
        pacientes: { criar: true, editar: true, visualizar: true, excluir: true },
        usuarios: { criar: true, editar: true, visualizar: true, excluir: true },
        medicos: { criar: true, editar: true, visualizar: true, excluir: true },
        enfermeiros: { criar: true, editar: true, visualizar: true, excluir: true },
        especialidades: { criar: true, editar: true, visualizar: true, excluir: true },
        exames: { solicitar: true, liberar: true, visualizar: true, criar: true },
        agendamento: { criar: true, cancelar: true, visualizar: true },
        sistema: { administrar: true }
      };

      const masterRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          nome: 'MASTER',
          permissoes: superPermissions
        }
      });

      // 3. Cria o Usuário Master da Clínica
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(dto.adminPass, salt);

      const masterUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: masterRole.id,
          nomeCompleto: dto.adminName,
          email: dto.adminEmail,
          password: hashedPassword,
          roleName: 'ADMIN',
          cpf: encryptedCpf,
          cpfHash: cpfHash,
          mustChangePassword: true, // Força a troca no primeiro acesso
          isActive: true
        }
      });

      return { tenant, masterUser: { email: masterUser.email, nome: masterUser.nomeCompleto } };
    });
  }
}