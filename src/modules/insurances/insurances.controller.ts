import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { InsurancesService } from './insurances.service';
import { CreateInsuranceDto, UpdateInsuranceDto } from './dto/insurance.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Convênios (Insurances)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('insurances')
export class InsurancesController {
  constructor(private readonly insurancesService: InsurancesService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar novo convênio' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createInsuranceDto: CreateInsuranceDto, @Req() req: TenantRequest) {
    return this.insurancesService.create(req.tenant.id, createInsuranceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os convênios' })
  findAll(@Req() req: TenantRequest) {
    return this.insurancesService.findAll(req.tenant.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.insurancesService.findOne(id, req.tenant.id);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateInsuranceDto: UpdateInsuranceDto, @Req() req: TenantRequest) {
    return this.insurancesService.update(id, req.tenant.id, updateInsuranceDto);
  }

  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.insurancesService.remove(id, req.tenant.id);
  }
}