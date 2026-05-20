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
import { SurgicalCenterModule } from './modules/surgical-center/surgical-center.module';
import { HospitalBillingModule } from './modules/hospital-billing/hospital-billing.module';

import { OccupationsModule } from './modules/occupations/occupations.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';

// MÓDULOS NOVOS
import { FinancialModule } from './modules/financial/financial.module';
import { CidModule } from './modules/cid/cid.module';
// 🔥 NOVO: IMPORTAÇÃO DO MÓDULO DE CONVÊNIOS
import { InsurancesModule } from './modules/insurances/insurances.module';

import { CacheModule } from './shared/infrastructure/cache/cache.module';
import { ScheduleModule } from '@nestjs/schedule';

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
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');
        
        return {
          connection: {
            host,
            port,
          },
        };
      },
      inject: [ConfigService],
    }),

    PrismaModule,
    CacheModule,
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

    AssistanceModule,
    PharmacyModule,
    SurgicalCenterModule,
    HospitalBillingModule,
    OccupationsModule,
    SpecialtiesModule,
    FinancialModule,
    CidModule,
    
    // 🔥 REGISTRO DO MÓDULO DE CONVÊNIOS
    InsurancesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantThrottlerGuard,
    },
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