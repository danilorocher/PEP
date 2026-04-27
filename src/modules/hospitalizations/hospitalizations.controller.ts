import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query, Headers, Ip } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { HospitalizationsUseCases } from '../../shared/application/use-cases/hospitalizations/hospitalizations.use-cases';
import { AdmitPatientDto, DischargePatientDto } from './dto/hospitalization.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Hospitalizations (Internações)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('hospitalizations')
export class HospitalizationsController {
  constructor(private readonly hospitalizationsUseCases: HospitalizationsUseCases) {}

  @Post('admit')
  @ApiOperation({ summary: 'Admitir paciente (Internação)' })
  @RequirePermissions({ module: 'internacao', action: 'admitir' })
  admitPatient(
    @Body() dto: AdmitPatientDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.hospitalizationsUseCases.admitPatient(req.tenant!.id, userId, dto, ip, userAgent || 'N/A');
  }

  @Patch(':id/discharge')
  @ApiOperation({ summary: 'Dar alta hospitalar' })
  @RequirePermissions({ module: 'internacao', action: 'alta' })
  dischargePatient(
    @Param('id') id: string,
    @Body() dto: DischargePatientDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    const userRole = (req as any).user.role;
    return this.hospitalizationsUseCases.dischargePatient(req.tenant!.id, id, userId, userRole, dto, ip, userAgent || 'N/A');
  }

  @Get()
  @ApiOperation({ summary: 'Listar internações' })
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  findAll(
    @Req() req: TenantRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('patientId') patientId: string,
    @Query('status') status: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    const filters = { patientId, status };
    return this.hospitalizationsUseCases.findAll(req.tenant!.id, Number(page) || 1, Number(limit) || 10, filters, userId, ip, userAgent || 'N/A');
  }
}