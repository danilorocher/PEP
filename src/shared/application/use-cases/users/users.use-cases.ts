import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { EncryptionService } from '../../../infrastructure/database/prisma/repositories/services/encryption.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from '../../../../modules/users/dto/user.dto';

@Injectable()
export class UsersUseCases {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private readonly userRepo: IUserRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async create(tenantId: string, data: CreateUserDto): Promise<Omit<User, 'password'>> {
    const encryptedCpf = this.encryption.encrypt(data.cpf);
    const exists = await this.userRepo.findByCpf(encryptedCpf, tenantId);
    if (exists) throw new BadRequestException('CPF já cadastrado nesta clínica.');

    const defaultPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const newUser = new User(
      crypto.randomUUID(), tenantId, data.roleId, data.nomeCompleto, encryptedCpf, data.email,
      true, true,
      data.dataNascimento ? new Date(data.dataNascimento) : null,
      data.sexo || null, data.telefone || null, data.enderecoCompleto || null,
      data.dataAdmissao ? new Date(data.dataAdmissao) : null,
      new Date(), new Date(), null
    );

    await this.userRepo.save(newUser, hashedPassword);
    return newUser;
  }

  async findAll(tenantId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.userRepo.findAll(tenantId, skip, limit);
    const decryptedData = data.map(user => ({
      ...user, cpf: this.encryption.decrypt(user.cpf)
    }));
    return { data: decryptedData, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepo.findById(id, tenantId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return { ...user, cpf: this.encryption.decrypt(user.cpf) } as User;
  }

  async update(id: string, tenantId: string, data: UpdateUserDto): Promise<void> {
    const user = await this.userRepo.findById(id, tenantId);
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const updatedUser = new User(
      user.id, user.tenantId, data.roleId || user.roleId, data.nomeCompleto || user.nomeCompleto,
      data.cpf ? this.encryption.encrypt(data.cpf) : user.cpf, data.email || user.email,
      data.isActive !== undefined ? data.isActive : user.isActive, user.mustChangePassword,
      data.dataNascimento ? new Date(data.dataNascimento) : user.dataNascimento,
      data.sexo || user.sexo, data.telefone || user.telefone, data.enderecoCompleto || user.enderecoCompleto,
      data.dataAdmissao ? new Date(data.dataAdmissao) : user.dataAdmissao,
      user.createdAt, new Date(), user.deletedAt
    );
    await this.userRepo.update(updatedUser);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.userRepo.softDelete(id, tenantId);
  }

  async changePassword(userId: string, tenantId: string, data: ChangePasswordDto): Promise<void> {
    // Utiliza o novo método tipado focado na autenticação/validação
    const authData = await this.userRepo.findAuthUserById(userId, tenantId);
    if (!authData) throw new NotFoundException('Usuário não encontrado.');
    
    const { user, passwordHash } = authData;

    const isPasswordValid = await bcrypt.compare(data.currentPassword, passwordHash);
    
    if (!isPasswordValid) throw new BadRequestException('Senha atual incorreta.');

    const newHashedPassword = await bcrypt.hash(data.newPassword, 12);
    const updatedUser = new User(
       user.id, user.tenantId, user.roleId, user.nomeCompleto, user.cpf, user.email,
       user.isActive, false, // mustChangePassword vira false
       user.dataNascimento, user.sexo, user.telefone, user.enderecoCompleto, user.dataAdmissao,
       user.createdAt, new Date(), user.deletedAt
    );
    await this.userRepo.update(updatedUser, newHashedPassword);
  }
}