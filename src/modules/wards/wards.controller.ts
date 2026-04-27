import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { WardsUseCases } from '../../shared/application/use-cases/wards/wards.use-cases';
import { CreateWardDto, UpdateWardDto } from './dto/ward.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Wards (Alas)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('wards')
export class WardsController {
  constructor(private readonly wardsUseCases: WardsUseCases) {}

  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createWardDto: CreateWardDto, @Req() req: TenantRequest) {
    return this.wardsUseCases.create(req.tenant.id, createWardDto);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Taxa de ocupação por ala (Dashboard)' })
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  getOccupancyRates(@Req() req: TenantRequest) {
    return this.wardsUseCases.getOccupancyRates(req.tenant.id);
  }

  @Get()
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  findAll(@Req() req: TenantRequest) {
    return this.wardsUseCases.findAll(req.tenant.id);
  }

  @Get(':id')
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.wardsUseCases.findOne(id, req.tenant.id);
  }

  @Get(':id/beds')
  @ApiOperation({ summary: 'Listar leitos de uma ala específica' })
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  getBedsByWard(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.wardsUseCases.getBedsByWard(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateWardDto: UpdateWardDto, @Req() req: TenantRequest) {
    return this.wardsUseCases.update(id, req.tenant.id, updateWardDto);
  }

  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.wardsUseCases.remove(id, req.tenant.id);
  }
}