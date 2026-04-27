import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { BedsUseCases } from '../../shared/application/use-cases/beds/beds.use-cases';
import { CreateBedDto, UpdateBedDto } from './dto/bed.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Beds (Leitos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('beds')
export class BedsController {
  constructor(private readonly bedsUseCases: BedsUseCases) {}

  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createBedDto: CreateBedDto, @Req() req: TenantRequest) {
    return this.bedsUseCases.create(req.tenant.id, createBedDto);
  }

  @Get('available')
  @ApiOperation({ summary: 'Listar leitos livres com filtro por tipo e ala' })
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  findAvailable(
    @Req() req: TenantRequest,
    @Query('tipo') tipo?: string,
    @Query('wardId') wardId?: string
  ) {
    return this.bedsUseCases.findAvailable(req.tenant.id, tipo, wardId);
  }

  @Get()
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  findAll(@Req() req: TenantRequest) {
    return this.bedsUseCases.findAll(req.tenant.id);
  }

  @Get(':id')
  @RequirePermissions({ module: 'internacao', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.bedsUseCases.findOne(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateBedDto: UpdateBedDto, @Req() req: TenantRequest) {
    return this.bedsUseCases.update(id, req.tenant.id, updateBedDto);
  }

  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.bedsUseCases.remove(id, req.tenant.id);
  }
}