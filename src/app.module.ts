import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as Joi from 'joi';

// Corrigido o caminho do PrismaModule
import { PrismaModule } from './shared/infrastructure/database/prisma/prisma.module';
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { TenantThrottlerGuard } from './common/guards/tenant-throttler.guard';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { NursesModule } from './modules/nurses/nurses.module';
import { WardsModule } from './modules/wards/wards.module';
import { BedsModule } from './modules/beds/beds.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';

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
    
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

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
    RolesModule,
    DoctorsModule,
    NursesModule,
    WardsModule,
    BedsModule,
    PatientsModule,
    AppointmentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
    {
      // Registra o Interceptor de Auditoria globalmente de forma que aceite Injeção de Dependências
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'api/docs', method: RequestMethod.ALL }) 
      .forRoutes('*');
  }
}