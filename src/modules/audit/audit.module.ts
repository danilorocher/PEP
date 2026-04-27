import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditUseCases } from '../../shared/application/use-cases/audit/audit.use-cases';
import { AUDIT_REPOSITORY_TOKEN } from '../../shared/domain/repositories/audit.repository.interface';
import { PrismaAuditRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-audit.repository';

@Module({
  controllers: [AuditController],
  providers: [
    AuditUseCases,
    {
      provide: AUDIT_REPOSITORY_TOKEN,
      useClass: PrismaAuditRepository,
    },
  ],
  exports: [AuditUseCases],
})
export class AuditModule {}