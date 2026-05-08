import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import * as Joi from 'joi';

import { PrismaModule } from './shared/infrastructure/database/prisma.module';
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { TenantThrottlerGuard } from './common/guards/tenant-throttler.guard';
import { AuditInterceptor } from './shared/interceptors/audit.interceptor';
// 🔥 NOVA IMPORTAÇÃO: Interceptor de Request ID para rastreabilidade
import { RequestIdInterceptor } from './shared/interceptors/request-id.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { NursesModule } from './modules/nurses/nurses.module';
import { WardsModule } from './modules/wards/wards.module';
import { BedsModule } from './modules/beds/beds.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';

import { MedicalRecordsModule } from './modules/medical-records/medical-records.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { ExamsModule } from './modules/exams/exams.module';
import { HospitalizationsModule } from './modules/hospitalizations/hospitalizations.module';
import { BillingModule } from './modules/billing/billing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuditModule } from './modules/audit/audit.module';
import { TenantsModule } from './modules/tenants/tenants.module';

import { AssistanceModule } from './modules/assistance/assistance.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
// 🔥 IMPORTAÇÃO DO MÓDULO CIRÚRGICO
import { SurgicalCenterModule } from './modules/surgical-center/surgical-center.module';
// 🔥 NOVA IMPORTAÇÃO: MÓDULO DE FATURAMENTO AVANÇADO (CONTA DO PACIENTE)
import { HospitalBillingModule } from './modules/hospital-billing/hospital-billing.module';

// 🔥 NOVO: IMPORTAÇÕES DOS MÓDULOS DE CONFIGURAÇÃO DINÂMICA
import { OccupationsModule } from './modules/occupations/occupations.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';

import { CacheModule } from './shared/infrastructure/cache/cache.module'; // 🔥 IMPORTAÇÃO DO CACHE
import { ScheduleModule } from '@nestjs/schedule'; //


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
      useFactory: async (configService: ConfigService) => {
        const rawHost = configService.get<string>('REDIS_HOST');
        // Se o host vier como "redis" (comum em Docker), forçamos localhost para rodar nativo no Windows
        const host = rawHost === 'redis' ? 'localhost' : rawHost;
        
        return {
          connection: {
            host: host,
            port: configService.get<number>('REDIS_PORT'),
          },
        };
      },
      inject: [ConfigService],
    }),

    PrismaModule,
    CacheModule, // 🔥 ADICIONADO AQUI: Agora todo o sistema reconhece o RedisService!

    // 🔥 ATUALIZAÇÃO FASE 3: Inicialização do motor de Cron Jobs do NestJS
    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    RolesModule,
    DoctorsModule,
    NursesModule,
    WardsModule,
    BedsModule,
    PatientsModule,
    AppointmentsModule,
    
    MedicalRecordsModule,
    PrescriptionsModule,
    MedicationsModule,
    ExamsModule,
    HospitalizationsModule,
    BillingModule,
    ReportsModule,
    AuditModule,
    TenantsModule,

    // Módulos Assistenciais
    AssistanceModule,
    PharmacyModule,
    // 🔥 MÓDULO DE CENTRO CIRÚRGICO REGISTRADO AQUI NA LISTA
    SurgicalCenterModule,
    // 🔥 NOVO MÓDULO DE FATURAMENTO AVANÇADO REGISTRADO AQUI
    HospitalBillingModule,

    // 🔥 REGISTRO DOS NOVOS MÓDULOS PARA CARGOS E ESPECIALIDADES
    OccupationsModule,
    SpecialtiesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
    // 🔥 NOVO INTERCEPTOR GLOBAL: Rastreabilidade (Request ID)
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestIdInterceptor,
    },
    {
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