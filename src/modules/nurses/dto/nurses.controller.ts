import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { NursesUseCases } from '../../shared/application/use-cases/nurses/nurses.use-cases';
import { CreateNurseDto, UpdateNurseDto } from './dto/nurse.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Nurses (Enfermeiros)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('nurses')
export class NursesController {
  constructor(private readonly nursesUseCases: NursesUseCases) {}

  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createNurseDto: CreateNurseDto, @Req() req: TenantRequest) {
    const requesterRole = (req as any).user.role; // Extraído do Payload do JWT
    return this.nursesUseCases.create(req.tenant.id, createNurseDto, requesterRole);
  }

  @Get()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(@Req() req: TenantRequest, @Query('page') page: string, @Query('limit') limit: string) {
    return this.nursesUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.nursesUseCases.findOne(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateNurseDto: UpdateNurseDto, @Req() req: TenantRequest) {
    const requesterRole = (req as any).user.role;
    return this.nursesUseCases.update(id, req.tenant.id, updateNurseDto, requesterRole);
  }

  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.nursesUseCases.remove(id, req.tenant.id);
  }
}