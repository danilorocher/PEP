import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { LoginUseCase } from '../../shared/application/use-cases/auth/login.use-case';
import { USER_REPOSITORY_TOKEN } from '../../shared/domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-user.repository';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Configurado dinamicamente no UseCase
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RedisService,
    JwtStrategy,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: PrismaUserRepository,
    },
  ],
})
export class AuthModule {}