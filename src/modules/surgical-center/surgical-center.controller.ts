import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

import { SurgicalScheduleUseCases } from '../../shared/application/use-cases/surgical-center/surgical-schedule.use-cases';
import { SurgicalExecutionUseCases } from '../../shared/application/use-cases/surgical-center/surgical-execution.use-cases';

import { 
  CreateSurgicalScheduleDto, CreatePreOpChecklistDto, 
  CreateAnesthesiaRecordDto, CreateSurgicalReportDto, 
  RegisterOpmeUsageDto, CreatePostOpChecklistDto 
} from './dto/surgical-center.dto';

@ApiTags('Surgical Center (Centro Cirúrgico)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('surgical-center')
export class SurgicalCenterController {
  constructor(
    private readonly scheduleUseCases: SurgicalScheduleUseCases,
    private readonly executionUseCases: SurgicalExecutionUseCases
  ) {}

  // =====================================
  // AGENDAMENTO E RECURSOS
  // =====================================
  @Get('resources')
  @ApiOperation({ summary: 'Listar salas cirúrgicas e equipamentos' })
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  getResources(@Req() req: TenantRequest) {
    return this.scheduleUseCases.getResourceCatalog(req.tenant.id);
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Agendar cirurgia com verificação de conflitos' })
  @RequirePermissions({ module: 'internacao', action: 'criar' })
  scheduleSurgery(@Body() dto: CreateSurgicalScheduleDto, @Req() req: TenantRequest) {
    return this.scheduleUseCases.scheduleSurgery(req.tenant.id, dto);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Listar agenda cirúrgica' })
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  getSchedules(
    @Req() req: TenantRequest,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.scheduleUseCases.listSchedules(req.tenant.id, start, end);
  }

  // =====================================
  // EXECUÇÃO E PROTOCOLOS DE SEGURANÇA
  // =====================================
  @Post('schedules/:id/pre-op-checklist')
  @ApiOperation({ summary: 'Registrar Checklist Pré-Operatório (OMS)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  registerPreOpChecklist(@Param('id') id: string, @Body() dto: CreatePreOpChecklistDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.executionUseCases.registerPreOpChecklist(req.tenant.id, id, userId, dto);
  }

  @Patch('schedules/:id/start')
  @ApiOperation({ summary: 'Iniciar cirurgia (Exige checklist validado)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  startSurgery(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.executionUseCases.startSurgery(req.tenant.id, id);
  }

  @Post('schedules/:id/anesthesia')
  @ApiOperation({ summary: 'Registrar Ficha Anestésica' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  registerAnesthesia(@Param('id') id: string, @Body() dto: CreateAnesthesiaRecordDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub; // Assumindo que quem registra é o anestesista autenticado
    return this.executionUseCases.registerAnesthesia(req.tenant.id, id, userId, dto);
  }

  @Post('schedules/:id/report')
  @ApiOperation({ summary: 'Registrar Relatório da Cirurgia' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  registerReport(@Param('id') id: string, @Body() dto: CreateSurgicalReportDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub; // Assumindo cirurgião logado
    return this.executionUseCases.registerReport(req.tenant.id, id, userId, dto);
  }

  @Post('schedules/:id/opme')
  @ApiOperation({ summary: 'Registrar uso e rastreabilidade de OPME' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  registerOPME(@Param('id') id: string, @Body() dto: RegisterOpmeUsageDto, @Req() req: TenantRequest) {
    return this.executionUseCases.registerOPME(req.tenant.id, id, dto);
  }

  @Post('schedules/:id/post-op-checklist')
  @ApiOperation({ summary: 'Registrar Checklist de Recuperação (SRPA)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  registerPostOpChecklist(@Param('id') id: string, @Body() dto: CreatePostOpChecklistDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.executionUseCases.registerPostOpChecklist(req.tenant.id, id, userId, dto);
  }
}