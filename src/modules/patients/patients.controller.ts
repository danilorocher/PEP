import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { PatientsUseCases } from '../../shared/application/use-cases/patients/patients.use-cases';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Patients (Pacientes)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsUseCases: PatientsUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar paciente (cria prontuário automaticamente)' })
  @RequirePermissions({ module: 'pacientes', action: 'criar' })
  create(@Body() createPatientDto: CreatePatientDto, @Req() req: TenantRequest) {
    return this.patientsUseCases.create(req.tenant.id, createPatientDto);
  }

  @Get()
  @RequirePermissions({ module: 'pacientes', action: 'visualizar' })
  findAll(
    @Req() req: TenantRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('nomeCompleto') nomeCompleto?: string,
    @Query('status') status?: string,
    @Query('convenioId') convenioId?: string
  ) {
    return this.patientsUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10, { nomeCompleto, status, convenioId });
  }

  @Get(':id')
  @RequirePermissions({ module: 'pacientes', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.patientsUseCases.findOne(id, req.tenant.id);
  }

  @Get(':id/medical-record')
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  getMedicalRecord(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.patientsUseCases.getMedicalRecord(id, req.tenant.id);
  }

  @Get(':id/hospitalizations')
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  getHospitalizations(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.patientsUseCases.getHospitalizations(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'pacientes', action: 'editar' })
  update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto, @Req() req: TenantRequest) {
    return this.patientsUseCases.update(id, req.tenant.id, updatePatientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete (Bloqueado se houver internação ativa)' })
  @RequirePermissions({ module: 'pacientes', action: 'excluir' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.patientsUseCases.remove(id, req.tenant.id);
  }

  // Novos Endpoints LGPD
  @Get(':id/data-export')
  @ApiOperation({ summary: 'Exportação completa de dados do titular (LGPD)' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  exportData(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.patientsUseCases.exportData(id, req.tenant.id);
  }

  @Post(':id/anonymize')
  @ApiOperation({ summary: 'Anonimização de dados do paciente (LGPD)' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  anonymize(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.patientsUseCases.anonymize(id, req.tenant.id);
  }
}