import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IRoleRepository, ROLE_REPOSITORY_TOKEN } from '../../../domain/repositories/role.repository.interface';
import { Role } from '../../../domain/entities/role.entity';
import * as crypto from 'crypto';
import { CreateRoleDto, UpdateRoleDto } from '../../../../modules/roles/dto/role.dto';

@Injectable()
export class RolesUseCases {
  constructor(
    @Inject(ROLE_REPOSITORY_TOKEN) private readonly roleRepo: IRoleRepository,
  ) {}

  async create(tenantId: string, data: CreateRoleDto): Promise<Role> {
    const newRole = new Role(
      crypto.randomUUID(), tenantId, data.nome, data.permissoes, new Date(), new Date(), null
    );
    return this.roleRepo.create(newRole);
  }

  async findAll(tenantId: string): Promise<Role[]> {
    return this.roleRepo.findAll(tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<Role> {
    const role = await this.roleRepo.findById(id, tenantId);
    if (!role) throw new NotFoundException('Perfil não encontrado.');
    return role;
  }

  async update(id: string, tenantId: string, data: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id, tenantId);
    const updatedRole = new Role(
      role.id, role.tenantId, data.nome || role.nome, data.permissoes || role.permissoes,
      role.createdAt, new Date(), role.deletedAt
    );
    return this.roleRepo.update(updatedRole);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.roleRepo.softDelete(id, tenantId);
  }
}