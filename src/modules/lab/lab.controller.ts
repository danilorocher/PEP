import { Controller, Post, Body, Param, Get, UseGuards, Req } from '@nestjs/common';
import { LabUseCases } from '../../shared/application/use-cases/lab/lab.use-cases';
import { CreateLabOrderDto, CollectSampleDto, UpdateLabResultDto, SignReportDto } from './dto/lab.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@UseGuards(JwtAuthGuard)
@Controller('lab')
export class LabController {
  constructor(private readonly labUseCases: LabUseCases) {}

  @Post('orders')
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  createOrder(@Body() dto: CreateLabOrderDto, @Req() req: TenantRequest & { user: any }) {
    return this.labUseCases.createOrder(req.tenant.id, req.user.sub, dto);
  }

  @Post('orders/:id/collect')
  @RequirePermissions({ module: 'exames', action: 'criar' }) // Permissão de enfermagem/coleta
  collect(@Param('id') id: string, @Body() dto: CollectSampleDto, @Req() req: TenantRequest & { user: any }) {
    return this.labUseCases.collectSample(req.tenant.id, req.user.sub, id, dto.sampleType);
  }

  @Post('results/:id/release')
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  releaseResult(@Param('id') id: string, @Body() dto: UpdateLabResultDto, @Req() req: TenantRequest & { user: any }) {
    return this.labUseCases.processResult(req.tenant.id, req.user.sub, id, dto.value);
  }

  @Post('orders/:id/sign')
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  sign(@Param('id') id: string, @Body() dto: SignReportDto, @Req() req: TenantRequest & { user: any }) {
    return this.labUseCases.signReport(req.tenant.id, req.user.sub, id, dto.reportText);
  }

  @Get('orders/:id')
  @TransformResponse()
  getOrder(@Param('id') id: string, @Req() req: TenantRequest & { user: any }) {
    return this.labUseCases.getOrderDetails(req.tenant.id, id);
  }
}