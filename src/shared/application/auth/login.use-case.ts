import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { LoginDto } from '../../../../modules/auth/dto/login.dto';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    role: string;
    mustChangePassword: boolean;
  };
}

@Injectable()
export class LoginUseCase {
  private readonly logger = new Logger('AuthAudit');

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async execute(tenantId: string, ip: string, data: LoginDto): Promise<LoginResponse> {
    const user = await this.userRepository.findByEmail(data.email, tenantId);

    // Usa um cast para acessar a senha temporariamente, já que a Entidade pura não deve expor a senha por padrão
    const userRecord = user as any; 

    if (!user || !user.isActive) {
      this.logger.warn(`[AUDIT] Falha de Login - E-mail não encontrado ou inativo. IP: ${ip} | Tenant: ${tenantId} | E-mail: ${data.email}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(data.password, userRecord.password);

    if (!isPasswordValid) {
      this.logger.warn(`[AUDIT] Falha de Login - Senha incorreta. IP: ${ip} | Tenant: ${tenantId} | E-mail: ${data.email}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Geração do Access Token (15 minutos)
    const payload = { sub: user.id, email: user.email, role: user.role, tenantId };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });

    // Geração do Refresh Token (7 dias)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    // Salva o Refresh Token no Redis com expiração de 7 dias (604800 segundos)
    await this.redisService.setRefreshToken(user.id, refreshToken, 604800);

    this.logger.log(`[AUDIT] Login com sucesso. IP: ${ip} | Tenant: ${tenantId} | User: ${user.id}`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        mustChangePassword: userRecord.mustChangePassword,
      },
    };
  }
}