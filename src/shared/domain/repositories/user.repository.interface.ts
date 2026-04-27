import { User } from '../entities/user.entity';

export interface UserWithPassword {
  user: User;
  passwordHash: string;
}

export interface IUserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findByCpf(cpfCriptografado: string, tenantId: string): Promise<User | null>;
  findAll(tenantId: string, skip: number, take: number): Promise<{ data: User[]; total: number }>;
  
  // Métodos segregados exclusivamente para validação de credenciais (não poluem o domínio)
  findAuthUserByEmail(email: string, tenantId: string): Promise<UserWithPassword | null>;
  findAuthUserById(id: string, tenantId: string): Promise<UserWithPassword | null>;

  save(user: User, passwordHash?: string): Promise<void>;
  update(user: User, passwordHash?: string): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
}

export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');