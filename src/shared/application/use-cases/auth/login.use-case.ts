import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { LoginDto } from '../../../../modules/auth/dto/login.dto';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: string;
    mustChangePassword: boolean;
  };
  units?: any[];
  permissions?: any;
}

@Injectable()
export class LoginUseCase {
  private readonly MASTER_ADMIN_EMAIL = 'admin@pep.com';

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(tenantId: string, ip: string, data: LoginDto): Promise<LoginResponse> {
    
    // 🚀 BUSCA GLOBAL: Independentemente do hospital atual, buscamos a identidade central do usuário
    const userAccounts = await this.prisma.user.findMany({
      where: { email: data.email, isActive: true, deletedAt: null },
      include: {
        tenant: { select: { id: true, name: true, cnpj: true, subdomain: true } },
        role: { select: { permissoes: true } }
      }
    });

    if (userAccounts.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas ou usuário inativo.');
    }

    // Como as contas são unificadas pelo e-mail/CPF, validamos a senha do registro principal
    const mainAccount = userAccounts[0];
    const isPasswordValid = await bcrypt.compare(data.password, mainAccount.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    let units = [];
    let userPermissions = {};
    let currentAccount = mainAccount;

    // 🔥 LÓGICA MASTER ADMIN: Se for o admin@pep.com, ele vê TODOS os hospitais do banco
    if (data.email === this.MASTER_ADMIN_EMAIL) {
      const allTenants = await this.prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true, name: true, cnpj: true, subdomain: true }
      });
      units = allTenants.map(t => ({
        id: t.id,
        nomeFantasia: t.name,
        cnpj: t.cnpj,
        subdomain: t.subdomain
      }));
      // Concede permissão total (*) em todos os módulos para o front-end
      userPermissions = { "*": { "*": true } }; 
    } else {
      // Lógica normal para os outros usuários
      units = userAccounts.map(acc => ({
        id: acc.tenant.id,
        nomeFantasia: acc.tenant.name,
        cnpj: acc.tenant.cnpj,
        subdomain: acc.tenant.subdomain
      }));

      const isGlobalAuth = tenantId === 'GLOBAL_AUTH' || !tenantId;
      currentAccount = isGlobalAuth 
        ? mainAccount 
        : (userAccounts.find(acc => acc.tenant.id === tenantId) || mainAccount);

      userPermissions = currentAccount.role?.permissoes || {};
    }

    // Determina o contexto de banco de dados
    const finalTenantId = (tenantId === 'GLOBAL_AUTH' || !tenantId) ? mainAccount.tenantId : tenantId;

    // Gera os Tokens
    const payload = { 
      sub: mainAccount.id, 
      email: mainAccount.email, 
      role: data.email === this.MASTER_ADMIN_EMAIL ? 'MASTER_ADMIN' : currentAccount.roleId, 
      tenantId: finalTenantId 
    };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });

    await this.redisService.setRefreshToken(mainAccount.id, refreshToken, 604800);

    return {
      accessToken,
      refreshToken,
      user: {
        id: mainAccount.id,
        name: mainAccount.nomeCompleto,
        role: data.email === this.MASTER_ADMIN_EMAIL ? 'MASTER_ADMIN' : currentAccount.roleId,
        mustChangePassword: mainAccount.mustChangePassword,
      },
      units, 
      permissions: userPermissions
    };
  }
}