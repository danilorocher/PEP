import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { EncryptionService } from '../../../infrastructure/database/prisma/repositories/services/encryption.service';
import * as bcrypt from 'bcryptjs'; // 🔥 PADRONIZADO E SEGURO
import * as crypto from 'crypto';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../../../../modules/users/dto/user.dto';
import { QueryUsersDto } from '../../../../modules/users/dto/query-users.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class UsersUseCases {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async create(tenantId: string, data: CreateUserDto): Promise<Omit<User, 'password'>> {
    const cpfHash = this.encryption.hash(data.cpf);
    const encryptedCpf = this.encryption.encrypt(data.cpf);
    if (await this.userRepo.findByCpf(cpfHash, tenantId)) throw new BadRequestException('CPF já cadastrado nesta clínica.');

    const defaultPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const newUser = new User(
      crypto.randomUUID(), tenantId, data.roleId, data.nomeCompleto, encryptedCpf, data.email,
      true, true, data.dataNascimento ? new Date(data.dataNascimento) : null,
      data.sexo || null, data.telefone || null, data.enderecoCompleto || null,
      data.dataAdmissao ? new Date(data.dataAdmissao) : null,
      new Date(), new Date(), null
    );

    await this.userRepo.save(newUser, hashedPassword);
    return newUser;
  }

  async findAll(tenantId: string, query: QueryUsersDto) {
    const { page, limit, search, roleId, isActive } = query;
    const { skip, take } = buildPaginationQuery(page, limit);

    const filters = { search, roleId, isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined };
    const { data, total } = await this.userRepo.findAll(tenantId, skip, take, filters);
    
    const decryptedData = data.map(user => ({
      ...user, cpf: this.encryption.decrypt(user.cpf)
    }));
    return buildPaginatedResult(decryptedData, total, page, limit);
  }

  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepo.findById(id, tenantId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return { ...user, cpf: this.encryption.decrypt(user.cpf) } as User;
  }

  async update(id: string, tenantId: string, data: UpdateUserDto): Promise<void> {
    const user = await this.userRepo.findById(id, tenantId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    let encryptedCpf = user.cpf;
    let cpfHash = undefined;
    if (data.cpf) {
        encryptedCpf = this.encryption.encrypt(data.cpf);
        cpfHash = this.encryption.hash(data.cpf);
    }

    const updatedUser = new User(
      user.id, user.tenantId, data.roleId || user.roleId, data.nomeCompleto || user.nomeCompleto,
      encryptedCpf, data.email || user.email,
      data.isActive !== undefined ? data.isActive : user.isActive, user.mustChangePassword,
      data.dataNascimento ? new Date(data.dataNascimento) : user.dataNascimento,
      data.sexo || user.sexo, data.telefone || user.telefone, data.enderecoCompleto || user.enderecoCompleto,
      data.dataAdmissao ? new Date(data.dataAdmissao) : user.dataAdmissao,
      user.createdAt, new Date(), user.deletedAt
    );
    await this.userRepo.update(updatedUser, undefined);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.userRepo.softDelete(id, tenantId);
  }

  async changePassword(userId: string, tenantId: string, data: ChangePasswordDto): Promise<void> {
    const authData = await this.userRepo.findAuthUserById(userId, tenantId);
    if (!authData) throw new NotFoundException('Usuário não encontrado.');
    
    const { user, passwordHash } = authData;
    const isPasswordValid = await bcrypt.compare(data.currentPassword, passwordHash);
    if (!isPasswordValid) throw new BadRequestException('Senha atual incorreta.');

    const newHashedPassword = await bcrypt.hash(data.newPassword, 12);
    const updatedUser = new User(
       user.id, user.tenantId, user.roleId, user.nomeCompleto, user.cpf, user.email,
       user.isActive, false, user.dataNascimento, user.sexo, user.telefone, user.enderecoCompleto, user.dataAdmissao,
       user.createdAt, new Date(), user.deletedAt
    );
    await this.userRepo.update(updatedUser, newHashedPassword);
  }
}