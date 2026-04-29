import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

import { VitalSignsUseCases } from '../../shared/application/use-cases/assistance/vital-signs.use-cases';
import { FluidBalanceUseCases } from '../../shared/application/use-cases/assistance/fluid-balance.use-cases';
import { RiskAssessmentsUseCases } from '../../shared/application/use-cases/assistance/risk-assessments.use-cases';

import { 
  CreateVitalSignDto, CreateFluidBalanceDto, AddFluidEntryDto, AddFluidOutputDto,
  CreateBradenDto, CreateMorseDto, CreateGlasgowDto 
} from './dto/assistance.dto';

@ApiTags('Assistance (Assistência ao Paciente)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('assistance')
export class AssistanceController {
  constructor(
    private readonly vitalSignsUseCases: VitalSignsUseCases,
    private readonly fluidBalanceUseCases: FluidBalanceUseCases,
    private readonly riskAssessmentsUseCases: RiskAssessmentsUseCases
  ) {}

  // =====================================
  // SINAIS VITAIS
  // =====================================
  @Post('vital-signs')
  @ApiOperation({ summary: 'Registrar Sinais Vitais' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  createVitalSign(@Body() dto: CreateVitalSignDto, @Req() req: TenantRequest) {
    return this.vitalSignsUseCases.create(req.tenant.id, (req as any).user.sub, dto);
  }

  @Get('vital-signs/patient/:patientId')
  @ApiOperation({ summary: 'Listar Sinais Vitais do Paciente' })
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  getVitalSigns(@Param('patientId') patientId: string, @Query('page') page: string, @Req() req: TenantRequest) {
    return this.vitalSignsUseCases.findByPatient(req.tenant.id, patientId, Number(page) || 1, 20);
  }

  // =====================================
  // BALANÇO HÍDRICO
  // =====================================
  @Get('fluid-balance/patient/:patientId') // 🔥 ROTA ADICIONADA PARA CORRIGIR O ERRO
  @ApiOperation({ summary: 'Listar Balanços Hídricos do Paciente' })
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  getFluidBalances(@Param('patientId') patientId: string, @Req() req: TenantRequest) {
    return this.fluidBalanceUseCases.findByPatient(req.tenant.id, patientId);
  }

  @Post('fluid-balance')
  @ApiOperation({ summary: 'Abrir novo Balanço Hídrico' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  openFluidBalance(@Body() dto: CreateFluidBalanceDto, @Req() req: TenantRequest) {
    return this.fluidBalanceUseCases.openBalance(req.tenant.id, (req as any).user.sub, dto);
  }

  @Post('fluid-balance/:id/entry')
  @ApiOperation({ summary: 'Adicionar Entrada (Input)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  addFluidEntry(@Param('id') id: string, @Body() dto: AddFluidEntryDto, @Req() req: TenantRequest) {
    return this.fluidBalanceUseCases.addEntry(req.tenant.id, (req as any).user.sub, id, dto);
  }

  @Post('fluid-balance/:id/output')
  @ApiOperation({ summary: 'Adicionar Saída (Output)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  addFluidOutput(@Param('id') id: string, @Body() dto: AddFluidOutputDto, @Req() req: TenantRequest) {
    return this.fluidBalanceUseCases.addOutput(req.tenant.id, (req as any).user.sub, id, dto);
  }

  // =====================================
  // ESCALAS DE RISCO
  // =====================================
  @Post('risk/braden')
  @ApiOperation({ summary: 'Avaliação de Risco de Lesão (Braden)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  createBraden(@Body() dto: CreateBradenDto, @Req() req: TenantRequest) {
    return this.riskAssessmentsUseCases.createBraden(req.tenant.id, (req as any).user.sub, dto);
  }

  @Post('risk/morse')
  @ApiOperation({ summary: 'Avaliação de Risco de Queda (Morse)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  createMorse(@Body() dto: CreateMorseDto, @Req() req: TenantRequest) {
    return this.riskAssessmentsUseCases.createMorse(req.tenant.id, (req as any).user.sub, dto);
  }

  @Post('risk/glasgow')
  @ApiOperation({ summary: 'Avaliação Neurológica (Glasgow)' })
  @RequirePermissions({ module: 'prontuario', action: 'editar' })
  createGlasgow(@Body() dto: CreateGlasgowDto, @Req() req: TenantRequest) {
    return this.riskAssessmentsUseCases.createGlasgow(req.tenant.id, (req as any).user.sub, dto);
  }
}