import { Controller, Get, Post, Body, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { GenerateReportDto } from './dto/report-request.dto';
import { RedisService } from '../../shared/infrastructure/redis/redis.service';
import type { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Reports (Relatórios Assíncronos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    @InjectQueue('reports') private readonly reportsQueue: Queue,
    private readonly redisService: RedisService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Solicitar geração de relatório assíncrono' })
  @RequirePermissions({ module: 'relatorios', action: 'criar' })
  async generate(@Body() dto: GenerateReportDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    
    const job = await this.reportsQueue.add('generate-report', {
      ...dto,
      tenantId: req.tenant.id,
      userId,
    });

    return { jobId: job.id };
  }

  @Get(':jobId/status')
  @ApiOperation({ summary: 'Verificar status do processamento do relatório' })
  @RequirePermissions({ module: 'relatorios', action: 'visualizar' })
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.reportsQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Trabalho não encontrado');

    const state = await job.getState();
    const progress = job.progress;
    const reason = job.failedReason;

    return { jobId, state, progress, reason };
  }

  @Get(':jobId/result')
  @ApiOperation({ summary: 'Obter o resultado final do relatório (Disponível por 1h)' })
  @RequirePermissions({ module: 'relatorios', action: 'visualizar' })
  async getResult(@Param('jobId') jobId: string) {
    const cacheKey = `report_result:${jobId}`;
    const result = await this.redisService.get(cacheKey);

    if (!result) {
      const job = await this.reportsQueue.getJob(jobId);
      if (!job) throw new NotFoundException('Relatório não encontrado ou expirado');
      
      const state = await job.getState();
      if (state !== 'completed') {
        return { message: `O relatório ainda está com status: ${state}`, state };
      }
      
      throw new NotFoundException('Resultado expirado do cache (TTL 1h)');
    }

    return JSON.parse(result);
  }
}