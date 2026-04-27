import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import { ReportsGeneratorUseCase } from './use-cases/reports-generator.use-case';

@Processor('reports')
export class ReportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor(
    private readonly reportsGenerator: ReportsGeneratorUseCase,
    private readonly redisService: RedisService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { type, startDate, endDate, params, tenantId, userId } = job.data;
    const jobId = job.id;

    this.logger.log(`Iniciando processamento de relatório: ${type} (Job: ${jobId})`);

    try {
      const result = await this.reportsGenerator.execute(tenantId, {
        type,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        params,
      });

      const cacheKey = `report_result:${jobId}`;
      
      // Armazenamento em Redis com TTL de 1 hora (3600 segundos)
      await this.redisService.set(cacheKey, JSON.stringify({
        type,
        generatedAt: new Date(),
        data: result
      }), 3600);

      this.logger.log(`Relatório finalizado e armazenado: ${cacheKey}`);
      
      return { success: true, cacheKey };
    } catch (error) {
      this.logger.error(`Falha ao gerar relatório ${jobId}: ${error.message}`);
      throw error;
    }
  }
}