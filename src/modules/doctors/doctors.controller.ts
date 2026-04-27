import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { DoctorsUseCases } from '../../shared/application/use-cases/doctors/doctors.use-cases';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

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
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(
    @Req() req: TenantRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('specialtyId') specialtyId: string,
    @Query('status') status: string
  ) {
    return this.doctorsUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10, specialtyId, status);
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