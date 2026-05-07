import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { DoctorsUseCases } from '../../shared/application/use-cases/users/doctors/doctors.use-cases';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';
import { QueryDoctorsDto } from './dto/query-doctors.dto';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';
 
@ApiTags('Doctors (Médicos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsUseCases: DoctorsUseCases) {}
 
  @Post()
  @RequirePermissions({ module: 'medicos', action: 'criar' })
  create(@Body() createDoctorDto: CreateDoctorDto, @Req() req: TenantRequest) {
    return this.doctorsUseCases.create(req.tenant.id, createDoctorDto);
  }
 
  @Get()
  @TransformResponse()
  @RequirePermissions({ module: 'medicos', action: 'visualizar' }) // 🔥 Alterado para o módulo específico
  findAll(@Req() req: TenantRequest, @Query() query: QueryDoctorsDto) {
    return this.doctorsUseCases.findAll(req.tenant.id, query);
  }

  // 🔥 BUG 4 RESOLVIDO: Rota exposta. Deve ficar ANTES do @Get(':id')
  @Get('catalog/specialties')
  @TransformResponse()
  @RequirePermissions({ module: 'agendamento', action: 'visualizar' }) 
  findAllSpecialties() {
    return this.doctorsUseCases.findAllSpecialties();
  }
 
  @Get(':id')
  @RequirePermissions({ module: 'medicos', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.doctorsUseCases.findOne(id, req.tenant.id);
  }
 
  @Patch(':id')
  @RequirePermissions({ module: 'medicos', action: 'editar' })
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto, @Req() req: TenantRequest) {
    return this.doctorsUseCases.update(id, req.tenant.id, updateDoctorDto);
  }
 
  @Delete(':id')
  @RequirePermissions({ module: 'medicos', action: 'excluir' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.doctorsUseCases.remove(id, req.tenant.id);
  }
}