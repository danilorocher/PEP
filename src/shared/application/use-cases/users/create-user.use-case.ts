import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import * as crypto from 'crypto';

interface CreateUserDto {
  tenantId: string;
  email: string;
  name: string;
  role: string;
}

@Injectable()
export class CreateUserUseCase {
  // Injeção baseada na INTERFACE (Inversão de Dependência)
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.email, data.tenantId);
    
    if (existingUser) {
      throw new Error('Usuário já existe nesta clínica.');
    }

    const newUser = new User(
      crypto.randomUUID(),
      data.tenantId,
      data.email,
      data.name,
      data.role,
      true,
      new Date(),
      new Date(),
    );

    await this.userRepository.save(newUser);
    return newUser;
  }
}