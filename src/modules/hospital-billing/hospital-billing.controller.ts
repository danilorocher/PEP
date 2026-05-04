import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

import { HospitalBillingUseCases } from '../../shared/application/use-cases/hospital-billing/hospital-billing.use-cases';
import { AccountConsumptionService } from '../../shared/application/use-cases/hospital-billing/account-consumption.service';
import { RecordConsumptionDto, GenerateSUSBillingDto, RegisterDenialDto, AssignDRGDto } from './dto/hospital-billing.dto';

@ApiTags('Hospital Billing (Faturamento e Contas Hospitalares)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('hospital-billing')
export class HospitalBillingController {
  constructor(
    private readonly billingUseCases: HospitalBillingUseCases,
    private readonly consumptionService: AccountConsumptionService
  ) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Listar contas hospitalares' })
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  listAccounts(@Req() req: TenantRequest, @Query('status') status?: string) {
    return this.billingUseCases.listAccounts(req.tenant.id, status);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Obter detalhes de uma conta hospitalar' })
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  getAccountDetails(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.billingUseCases.getAccountDetails(req.tenant.id, id);
  }

  @Post('accounts/consume')
  @ApiOperation({ summary: 'Lançamento avulso de consumo na conta do paciente' })
  @RequirePermissions({ module: 'faturamento', action: 'criar' })
  recordConsumption(@Body() dto: RecordConsumptionDto, @Req() req: TenantRequest) {
    return this.consumptionService.recordConsumption(req.tenant.id, dto);
  }

  @Patch('accounts/:id/close')
  @ApiOperation({ summary: 'Fechar a conta hospitalar para faturamento' })
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  closeAccount(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.billingUseCases.closeAccount(req.tenant.id, id);
  }

  @Post('accounts/:id/sus-billing')
  @ApiOperation({ summary: 'Gerar Faturamento SUS (AIH/BPA)' })
  @RequirePermissions({ module: 'faturamento', action: 'criar' })
  generateSUSBilling(@Param('id') id: string, @Body() dto: GenerateSUSBillingDto, @Req() req: TenantRequest) {
    return this.billingUseCases.generateSUSBilling(req.tenant.id, id, dto);
  }

  @Post('accounts/:id/denials')
  @ApiOperation({ summary: 'Registar Glosa Hospitalar' })
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  registerDenial(@Param('id') id: string, @Body() dto: RegisterDenialDto, @Req() req: TenantRequest) {
    return this.billingUseCases.registerDenial(req.tenant.id, id, dto);
  }

  @Post('accounts/:id/drg')
  @ApiOperation({ summary: 'Associar conta a um DRG para análise de custos' })
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  assignDRG(@Param('id') id: string, @Body() dto: AssignDRGDto, @Req() req: TenantRequest) {
    return this.billingUseCases.assignDRG(req.tenant.id, id, dto);
  }
}