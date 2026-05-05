import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

import { PharmacyStockUseCases } from '../../shared/application/use-cases/pharmacy/stock.use-cases';
import { PharmacyDispensationUseCases } from '../../shared/application/use-cases/pharmacy/dispensation.use-cases';
import { PharmacyInteractionUseCases } from '../../shared/application/use-cases/pharmacy/interaction.use-cases';
import { AddStockDto, CreateDispensationDto, CreateInteractionDto } from './dto/pharmacy.dto';

@ApiTags('Pharmacy (Farmácia Hospitalar)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pharmacy')
export class PharmacyController {
  constructor(
    private readonly stockUseCases: PharmacyStockUseCases,
    private readonly dispensationUseCases: PharmacyDispensationUseCases,
    private readonly interactionUseCases: PharmacyInteractionUseCases
  ) {}

  // --- MÓDULO CATÁLOGO ---
  @Get('medications/catalog')
  @ApiOperation({ summary: 'Listar catálogo base de medicamentos' })
  @RequirePermissions({ module: 'medicacao', action: 'visualizar' }) // 🔥 Permissão corrigida
  getCatalog(@Req() req: TenantRequest) {
    return this.stockUseCases.getAllMedicationsCatalog(req.tenant.id);
  }

  @Post('medications/catalog')
  @ApiOperation({ summary: 'Cadastrar novo medicamento no catálogo' })
  @RequirePermissions({ module: 'medicacao', action: 'criar' }) // 🔥 Permissão corrigida
  createCatalogItem(@Body() data: any, @Req() req: TenantRequest) {
    return this.stockUseCases.createCatalogItem(req.tenant.id, data);
  }

  // --- MÓDULO ESTOQUE ---
  @Get('stock')
  @ApiOperation({ summary: 'Listar todo o estoque' })
  @RequirePermissions({ module: 'medicacao', action: 'visualizar' }) // 🔥 Permissão corrigida
  getAllStock(@Req() req: TenantRequest) {
    return this.stockUseCases.getAllStock(req.tenant.id);
  }

  @Post('stock')
  @ApiOperation({ summary: 'Adicionar lote ao estoque' })
  @RequirePermissions({ module: 'medicacao', action: 'criar' }) // 🔥 Permissão corrigida
  addStock(@Body() dto: AddStockDto, @Req() req: TenantRequest) {
    return this.stockUseCases.addStock(req.tenant.id, dto);
  }

  @Get('stock/:medicationId')
  @ApiOperation({ summary: 'Consultar estoque de um medicamento' })
  @RequirePermissions({ module: 'medicacao', action: 'visualizar' }) // 🔥 Permissão corrigida
  getStock(@Param('medicationId') medicationId: string, @Req() req: TenantRequest) {
    return this.stockUseCases.getStockByMedication(req.tenant.id, medicationId);
  }

  // --- MÓDULO DISPENSAÇÃO ---
  @Get('dispensations/pending')
  @ApiOperation({ summary: 'Listar prescrições pendentes de dispensação' })
  @RequirePermissions({ module: 'medicacao', action: 'visualizar' }) // 🔥 Permissão corrigida
  getPendingPrescriptions(@Req() req: TenantRequest) {
    return this.dispensationUseCases.getPendingPrescriptions(req.tenant.id);
  }

  @Post('dispense')
  @ApiOperation({ summary: 'Realizar dispensação farmacêutica (Baixa de Estoque + Kardex)' })
  @RequirePermissions({ module: 'medicacao', action: 'criar' }) // 🔥 Permissão corrigida
  dispense(@Body() dto: CreateDispensationDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.dispensationUseCases.dispense(req.tenant.id, userId, dto);
  }

  // --- MÓDULO INTERAÇÕES ---
  @Post('interactions/rules')
  @ApiOperation({ summary: 'Cadastrar nova regra de interação medicamentosa' })
  @RequirePermissions({ module: 'medicacao', action: 'criar' }) // 🔥 Permissão corrigida
  addInteractionRule(@Body() dto: CreateInteractionDto, @Req() req: TenantRequest) {
    return this.interactionUseCases.addInteractionRule(req.tenant.id, dto);
  }

  @Post('interactions/check')
  @ApiOperation({ summary: 'Verificar interações entre múltiplos medicamentos' })
  @RequirePermissions({ module: 'prontuario', action: 'visualizar' })
  checkInteractions(@Body('medicationIds') medicationIds: string[], @Req() req: TenantRequest) {
    return this.interactionUseCases.checkInteractions(req.tenant.id, medicationIds);
  }
}