import { Role } from '../entities/role.entity';

export interface IRoleRepository {
  create(role: Role): Promise<Role>;
  findAll(tenantId: string): Promise<Role[]>;
  findById(id: string, tenantId: string): Promise<Role | null>;
  update(role: Role): Promise<Role>;
  softDelete(id: string, tenantId: string): Promise<void>;
}

export const ROLE_REPOSITORY_TOKEN = Symbol('IRoleRepository');