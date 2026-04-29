import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

import { PharmacyStockUseCases } from '../../shared/application/use-cases/pharmacy/stock.use-cases';
import { PharmacyDispensationUseCases } from '../../shared/application/use-cases/pharmacy/dispensation.use-cases';
import { PharmacyInteractionUseCases } from '../../shared/application/use-cases/pharmacy/interaction.use-cases';

// 🔥 CORREÇÃO: Removido o CheckInteractionsDto desta linha pois ele não é utilizado
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

  @Get('medications/catalog')
  @ApiOperation({ summary: 'Listar catálogo base de medicamentos' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  getCatalog(@Req() req: TenantRequest) {
    return this.stockUseCases.getAllMedicationsCatalog(req.tenant.id);
  }

  @Post('stock')
  @ApiOperation({ summary: 'Adicionar lote ao estoque' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  addStock(@Body() dto: AddStockDto, @Req() req: TenantRequest) {
    return this.stockUseCases.addStock(req.tenant.id, dto);
  }

  @Get('stock/:medicationId')
  @ApiOperation({ summary: 'Consultar estoque de um medicamento' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  getStock(@Param('medicationId') medicationId: string, @Req() req: TenantRequest) {
    return this.stockUseCases.getStockByMedication(req.tenant.id, medicationId);
  }

  @Get('dispensations/pending')
  @ApiOperation({ summary: 'Listar prescrições pendentes de dispensação' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  getPendingPrescriptions(@Req() req: TenantRequest) {
    return this.dispensationUseCases.getPendingPrescriptions(req.tenant.id);
  }

  @Post('dispense')
  @ApiOperation({ summary: 'Realizar dispensação farmacêutica (Baixa de Estoque + Kardex)' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  dispense(@Body() dto: CreateDispensationDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.dispensationUseCases.dispense(req.tenant.id, userId, dto);
  }

  @Post('interactions/rules')
  @ApiOperation({ summary: 'Cadastrar nova regra de interação medicamentosa' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
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