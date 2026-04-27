import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma/repositories/prisma.service';

@Processor('medication-status')
export class MedicationStatusProcessor extends WorkerHost {
  private readonly logger = new Logger(MedicationStatusProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Executando job ${job.name} (ID: ${job.id}) para verificar medicações atrasadas...`);

    const now = new Date();

    const result = await this.prisma.medicationAdministration.updateMany({
      where: {
        status: 'NAO_MINISTRADO',
        dataHoraProgamada: {
          lt: now,
        },
        deletedAt: null,
      },
      data: {
        status: 'ATRASADO',
      },
    });

    this.logger.log(`Atualizadas ${result.count} medicações para o status ATRASADO.`);
    return { updatedCount: result.count };
  }
}