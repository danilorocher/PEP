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
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(tenantId: string, ip: string, data: LoginDto): Promise<LoginResponse> {
    // 1. Busca o utilizador no Tenant atual (pelo subdomínio)
    const authData = await this.userRepository.findAuthUserByEmail(data.email, tenantId);

    if (!authData || !authData.user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas para esta unidade.');
    }

    const { user, passwordHash } = authData;
    const isPasswordValid = await bcrypt.compare(data.password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // 2. BUSCA GLOBAL: Encontra todos os hospitais onde este e-mail existe
    const userAccounts = await this.prisma.user.findMany({
      where: { email: data.email, isActive: true, deletedAt: null },
      include: {
        tenant: { select: { id: true, name: true, cnpj: true, subdomain: true } },
        role: { select: { permissoes: true } } // Pega as permissões do cargo
      }
    });

    // Mapeia para o formato que o Frontend espera (units)
    const units = userAccounts.map(acc => ({
      id: acc.tenant.id,
      nomeFantasia: acc.tenant.name,
      cnpj: acc.tenant.cnpj,
      subdomain: acc.tenant.subdomain
    }));

    // 🔥 CORREÇÃO: Extraímos as permissões diretamente da busca do Prisma para o hospital atual
    const currentAccount = userAccounts.find(acc => acc.tenant.id === tenantId);
    const userPermissions = currentAccount?.role?.permissoes || {};

    const payload = { sub: user.id, email: user.email, role: user.roleId, tenantId };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
    });

    await this.redisService.setRefreshToken(user.id, refreshToken, 604800);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.nomeCompleto,
        role: user.roleId,
        mustChangePassword: user.mustChangePassword,
      },
      units, 
      permissions: userPermissions // 🔥 Variavel corrigida que não quebra o TypeScript
    };
  }
}