import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Headers, Ip } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { MedicalRecordsUseCases } from '../../shared/application/use-cases/medical-records/medical-records.use-cases';
import { CreateClinicalEvolutionDto } from './dto/clinical-evolution.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Medical Records (Prontuários)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsUseCases: MedicalRecordsUseCases) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obter prontuário completo' })
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  getById(
    @Param('id') id: string,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.medicalRecordsUseCases.getById(id, req.tenant!.id, userId, ip, userAgent || 'N/A');
  }

  @Post(':id/evolutions')
  @ApiOperation({ summary: 'Registrar evolução clínica' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  createEvolution(
    @Param('id') recordId: string,
    @Body() dto: CreateClinicalEvolutionDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;
    return this.medicalRecordsUseCases.createEvolution(req.tenant!.id, recordId, userId, userRole, dto, ip, userAgent || 'N/A');
  }

  @Get(':id/evolutions')
  @ApiOperation({ summary: 'Listar evoluções do prontuário' })
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  getEvolutions(
    @Param('id') recordId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.medicalRecordsUseCases.getEvolutions(req.tenant!.id, recordId, Number(page) || 1, Number(limit) || 10, userId, ip, userAgent || 'N/A');
  }

  @Get(':id/evolutions/:evolutionId/history')
  @ApiOperation({ summary: 'Histórico de versões de uma evolução' })
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  getEvolutionHistory(
    @Param('evolutionId') evolutionId: string,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.medicalRecordsUseCases.getEvolutionHistory(req.tenant!.id, evolutionId, userId, ip, userAgent || 'N/A');
  }
}