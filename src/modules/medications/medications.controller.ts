import { Controller, Get, Patch, Body, Param, UseGuards, Req, Query, Headers, Ip } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { MedicationAdministrationsUseCases } from '../../shared/application/use-cases/medications/medication-administrations.use-cases';
import { AdministerMedicationDto } from './dto/medication-administration.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Medications (Controle de Medicação)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('medication-administrations')
export class MedicationsController {
  constructor(private readonly medicationUseCases: MedicationAdministrationsUseCases) {}

  @Get('pending')
  @ApiOperation({ summary: 'Listar medicações pendentes/atrasadas do Tenant' })
  @RequirePermissions({ module: 'medicacao', action: 'visualizar' })
  getPendingAdministrations(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.medicationUseCases.getPendingAdministrations(req.tenant!.id, Number(page) || 1, Number(limit) || 10, userId, ip, userAgent || 'N/A');
  }

  @Patch(':id/administer')
  @ApiOperation({ summary: 'Registrar administração ou recusa de medicamento' })
  @RequirePermissions({ module: 'medicacao', action: 'administrar' })
  administerMedication(
    @Param('id') id: string,
    @Body() dto: AdministerMedicationDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.medicationUseCases.administerMedication(req.tenant!.id, id, userId, dto, ip, userAgent || 'N/A');
  }

  @Get('items/:itemId/history')
  @ApiOperation({ summary: 'Histórico de administrações de um item prescrito' })
  @RequirePermissions({ module: 'medicacao', action: 'visualizar' })
  getAdministrationHistory(
    @Param('itemId') itemId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.medicationUseCases.getAdministrationHistory(req.tenant!.id, itemId, Number(page) || 1, Number(limit) || 10, userId, ip, userAgent || 'N/A');
  }
}