import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { CreateTenantUseCase } from '../../shared/application/use-cases/tenants/create-tenant.use-case';
import { EncryptionService } from '../../shared/infrastructure/database/prisma/repositories/services/encryption.service';

@Module({
  controllers: [TenantsController],
  providers: [CreateTenantUseCase, EncryptionService],
})
export class TenantsModule {}