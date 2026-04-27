import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { RolesUseCases } from '../../shared/application/use-cases/roles/roles.use-cases';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Roles (Perfis de Acesso)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesUseCases: RolesUseCases) {}

  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createRoleDto: CreateRoleDto, @Req() req: TenantRequest) {
    return this.rolesUseCases.create(req.tenant.id, createRoleDto);
  }

  @Get()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(@Req() req: TenantRequest) {
    return this.rolesUseCases.findAll(req.tenant.id);
  }

  @Get(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.rolesUseCases.findOne(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @Req() req: TenantRequest) {
    return this.rolesUseCases.update(id, req.tenant.id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.rolesUseCases.remove(id, req.tenant.id);
  }
}