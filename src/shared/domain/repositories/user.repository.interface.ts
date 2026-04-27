import { User } from '../entities/user.entity';

// Isso é um PORT (Porta) na Clean Architecture
export interface IUserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Criamos um token para o NestJS conseguir injetar a interface
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');