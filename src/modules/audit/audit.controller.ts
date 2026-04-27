import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { AuditUseCases } from '../../shared/application/use-cases/audit/audit.use-cases';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Audit (Auditoria)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditUseCases: AuditUseCases) {}

  @Get('medical-record/:patientId')
  @ApiOperation({ summary: 'Consultar trilha de auditoria de acesso ao prontuário de um paciente' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  getMedicalRecordAudit(
    @Param('patientId') patientId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Req() req: TenantRequest,
  ) {
    return this.auditUseCases.getMedicalRecordAudit(
      req.tenant.id,
      patientId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }
}