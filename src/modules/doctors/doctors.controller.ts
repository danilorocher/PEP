import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';

// 🔥 CAMINHO CORRIGIDO AQUI: Adicionado a pasta "users/" no caminho
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
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createDoctorDto: CreateDoctorDto, @Req() req: TenantRequest) {
    return this.doctorsUseCases.create(req.tenant.id, createDoctorDto);
  }
 
  @Get()
  @TransformResponse()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(@Req() req: TenantRequest, @Query() query: QueryDoctorsDto) {
    return this.doctorsUseCases.findAll(req.tenant.id, query);
  }
 
  @Get(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.doctorsUseCases.findOne(id, req.tenant.id);
  }
 
  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto, @Req() req: TenantRequest) {
    return this.doctorsUseCases.update(id, req.tenant.id, updateDoctorDto);
  }
 
  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.doctorsUseCases.remove(id, req.tenant.id);
  }
}