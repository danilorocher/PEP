import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { BillingUseCases } from '../../shared/application/use-cases/billing/billing.use-cases';
import { CreateBillingGuideDto, UpdateBillingGuideStatusDto } from './dto/billing-guide.dto';
import { GlossItemDto } from './dto/billing-item.dto';
import type { TenantRequest } from '../../common/middlewares/tenant.middleware';

// 🔥 Importações de Resposta Padrão
import { QueryBillingGuidesDto } from './dto/query-billing.dto';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';

@ApiTags('Billing (Faturamento TISS)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingUseCases: BillingUseCases) {}

  @Post('guides')
  @ApiOperation({ summary: 'Criar nova guia de faturamento (Rascunho)' })
  @RequirePermissions({ module: 'faturamento', action: 'criar' })
  create(@Body() dto: CreateBillingGuideDto, @Req() req: TenantRequest) {
    return this.billingUseCases.createGuide(req.tenant.id, dto);
  }

  @Get('guides')
  @TransformResponse() // 🔥 Adicionado para o formato {success, data, meta}
  @ApiOperation({ summary: 'Listar guias com paginação e filtros' })
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findAll(@Req() req: TenantRequest, @Query() query: QueryBillingGuidesDto) {
    return this.billingUseCases.listGuides(req.tenant.id, query);
  }

  @Get('guides/:id')
  @ApiOperation({ summary: 'Obter detalhes de uma guia' })
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.billingUseCases.getGuide(id, req.tenant.id);
  }

  @Patch('guides/:id/submit')
  @ApiOperation({ summary: 'Alterar status da guia para ENVIADA' })
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  submit(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.billingUseCases.submitGuide(id, req.tenant.id);
  }

  @Patch('guides/:id/authorize')
  @ApiOperation({ summary: 'Processar retorno do convênio (Autorizar/Negar)' })
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  authorize(
    @Param('id') id: string,
    @Body() dto: UpdateBillingGuideStatusDto,
    @Req() req: TenantRequest,
  ) {
    return this.billingUseCases.authorizeGuide(id, req.tenant.id, dto);
  }

  @Patch('guides/:id/items/:itemId/gloss')
  @ApiOperation({ summary: 'Aplicar glosa em item específico da guia' })
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  glossItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: GlossItemDto,
    @Req() req: TenantRequest,
  ) {
    return this.billingUseCases.glossItem(id, itemId, req.tenant.id, dto);
  }
}