import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { LabController } from './lab.controller';
import { LabUseCases } from '../../shared/application/use-cases/lab/lab.use-cases';
import { LabIntegrationService } from '../../shared/application/use-cases/lab/lab-integration.service';
import { LabCriticalProcessor } from './workers/lab-critical.processor';
import { LAB_REPOSITORY_TOKEN } from '../../shared/domain/repositories/lab.repository.interface';
import { PrismaLabRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-lab.repository';

@Module({
  imports: [
    // Registra a fila de alertas críticos no Redis/BullMQ
    BullModule.registerQueue({
      name: 'lab-critical-alert',
    }),
  ],
  controllers: [LabController],
  providers: [
    LabUseCases,
    LabIntegrationService,
    LabCriticalProcessor,
    { provide: LAB_REPOSITORY_TOKEN, useClass: PrismaLabRepository },
  ],
  exports: [LabUseCases, LabIntegrationService],
})
export class LabModule {}