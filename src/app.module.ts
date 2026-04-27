import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { TenantThrottlerGuard } from './common/guards/tenant-throttler.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required(),
        ENCRYPTION_KEY: Joi.string().min(32).required(),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),
    
    // Configuração de Rate Limiting global (necessário para o ThrottlerGuard funcionar)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Configuração do BullMQ (Redis) para Filas
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    // Define o Throttler Guard Customizado como Global
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplica o middleware de Tenant em todas as rotas da API
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'api/docs', method: RequestMethod.ALL }) // Exclui o Swagger
      .forRoutes('*');
  }
}