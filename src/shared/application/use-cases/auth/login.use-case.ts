import { Inject, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY_TOKEN } from '../../../domain/repositories/user.repository.interface';
import { RedisService } from '../../../infrastructure/redis/redis.service';
import { LoginDto } from '../../../../modules/auth/dto/login.dto';

export interface LoginResponse {
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
    const authData = await this.userRepository.findAuthUserByEmail(data.email, tenantId);

    if (!authData || !authData.user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const { user, passwordHash } = authData;
    const isPasswordValid = await bcrypt.compare(data.password, passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

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
    };
  }
}