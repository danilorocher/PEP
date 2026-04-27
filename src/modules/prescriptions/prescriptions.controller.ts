import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, Headers, Ip } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { PrescriptionsUseCases } from '../../shared/application/use-cases/prescriptions/prescriptions.use-cases';
import { CreatePrescriptionDto, CreatePrescriptionItemDto, SuspendPrescriptionDto } from './dto/prescription.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Prescriptions (Prescrições)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsUseCases: PrescriptionsUseCases) {}

  @Post('medical-records/:recordId/prescriptions')
  @ApiOperation({ summary: 'Criar nova prescrição' })
  @RequirePermissions({ module: 'prescricao', action: 'criar' })
  create(
    @Param('recordId') recordId: string,
    @Body() dto: CreatePrescriptionDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;
    return this.prescriptionsUseCases.create(req.tenant!.id, recordId, userId, userRole, dto, ip, userAgent || 'N/A');
  }

  @Get('medical-records/:recordId/prescriptions')
  @ApiOperation({ summary: 'Listar prescrições do prontuário' })
  @RequirePermissions({ module: 'prescricao', action: 'visualizar' })
  findAllByMedicalRecord(
    @Param('recordId') recordId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.prescriptionsUseCases.findAllByMedicalRecord(req.tenant!.id, recordId, Number(page) || 1, Number(limit) || 10, userId, ip, userAgent || 'N/A');
  }

  @Patch('prescriptions/:id/suspend')
  @ApiOperation({ summary: 'Suspender uma prescrição' })
  @RequirePermissions({ module: 'prescricao', action: 'editar' })
  suspendPrescription(
    @Param('id') id: string,
    @Body() dto: SuspendPrescriptionDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.prescriptionsUseCases.suspendPrescription(req.tenant!.id, id, userId, dto, ip, userAgent || 'N/A');
  }

  @Post('prescriptions/:id/items')
  @ApiOperation({ summary: 'Adicionar item à prescrição' })
  @RequirePermissions({ module: 'prescricao', action: 'criar' })
  addItem(
    @Param('id') id: string,
    @Body() dto: CreatePrescriptionItemDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;
    return this.prescriptionsUseCases.addItem(req.tenant!.id, id, userId, userRole, dto, ip, userAgent || 'N/A');
  }

  @Delete('prescriptions/:id/items/:itemId')
  @ApiOperation({ summary: 'Cancelar/Suspender item da prescrição' })
  @RequirePermissions({ module: 'prescricao', action: 'editar' })
  cancelItem(
    @Param('itemId') itemId: string,
    @Body() dto: SuspendPrescriptionDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.prescriptionsUseCases.cancelItem(req.tenant!.id, itemId, userId, dto, ip, userAgent || 'N/A');
  }
}