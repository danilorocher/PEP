import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { NursesUseCases } from '../../shared/application/use-cases/users/nurses/nurses.use-cases';
import { CreateNurseDto, UpdateNurseDto } from './dto/nurse.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';
import { QueryNursesDto } from './dto/query-nurses.dto';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';
 
@ApiTags('Nurses (Enfermeiros)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('nurses')
export class NursesController {
  constructor(private readonly nursesUseCases: NursesUseCases) {}
 
  @Post()
  @RequirePermissions({ module: 'enfermeiros', action: 'criar' })
  create(@Body() createNurseDto: CreateNurseDto, @Req() req: TenantRequest) {
    const requesterRole = (req as any).user.role;
    return this.nursesUseCases.create(req.tenant.id, createNurseDto, requesterRole);
  }
 
  @Get()
  @TransformResponse()
  @RequirePermissions({ module: 'enfermeiros', action: 'visualizar' }) // 🔥 Alterado
  findAll(@Req() req: TenantRequest, @Query() query: QueryNursesDto) {
    return this.nursesUseCases.findAll(req.tenant.id, query);
  }
 
  @Get(':id')
  @RequirePermissions({ module: 'enfermeiros', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.nursesUseCases.findOne(id, req.tenant.id);
  }
 
  @Patch(':id')
  @RequirePermissions({ module: 'enfermeiros', action: 'editar' })
  update(@Param('id') id: string, @Body() updateNurseDto: UpdateNurseDto, @Req() req: TenantRequest) {
    const requesterRole = (req as any).user.role;
    return this.nursesUseCases.update(id, req.tenant.id, updateNurseDto, requesterRole);
  }
 
  @Delete(':id')
  @RequirePermissions({ module: 'enfermeiros', action: 'excluir' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.nursesUseCases.remove(id, req.tenant.id);
  }
}