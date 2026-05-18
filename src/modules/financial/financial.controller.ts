import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';
import { CostCenterUseCases } from '../../shared/application/use-cases/financial/cost-center.use-cases';
import { ChartOfAccountsUseCases } from '../../shared/application/use-cases/financial/chart-of-accounts.use-cases';
import { FinancialTransactionUseCases } from '../../shared/application/use-cases/financial/financial-transaction.use-cases';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
import { CreateChartOfAccountsDto, UpdateChartOfAccountsDto } from './dto/chart-of-accounts.dto';
import { CreateTransactionDto, UpdateTransactionDto, PayTransactionDto } from './dto/financial-transaction.dto';
import { QueryCostCentersDto, QueryTransactionsDto } from './dto/query-financial.dto';

@ApiTags('Financial')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial')
export class FinancialController {
  constructor(
    private readonly costCenterUseCases: CostCenterUseCases,
    private readonly chartOfAccountsUseCases: ChartOfAccountsUseCases,
    private readonly transactionUseCases: FinancialTransactionUseCases
  ) {}

  // --- CENTROS DE CUSTO ---
  @Post('cost-centers')
  @RequirePermissions({ module: 'faturamento', action: 'criar' })
  createCostCenter(@Req() req: any, @Body() dto: CreateCostCenterDto) {
    return this.costCenterUseCases.create(req.tenant.id, dto);
  }

  @Get('cost-centers')
  @TransformResponse()
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findAllCostCenters(@Req() req: any, @Query() query: QueryCostCentersDto) {
    return this.costCenterUseCases.findAll(req.tenant.id, query);
  }

  @Get('cost-centers/:id')
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findOneCostCenter(@Req() req: any, @Param('id') id: string) {
    return this.costCenterUseCases.findOne(id, req.tenant.id);
  }

  @Delete('cost-centers/:id')
  @RequirePermissions({ module: 'faturamento', action: 'excluir' })
  removeCostCenter(@Req() req: any, @Param('id') id: string) {
    return this.costCenterUseCases.remove(id, req.tenant.id);
  }

  // --- PLANO DE CONTAS ---
  @Post('chart-of-accounts')
  @RequirePermissions({ module: 'faturamento', action: 'criar' })
  createChartOfAccounts(@Req() req: any, @Body() dto: CreateChartOfAccountsDto) {
    return this.chartOfAccountsUseCases.create(req.tenant.id, dto);
  }

  @Get('chart-of-accounts')
  @TransformResponse()
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findAllChartOfAccounts(@Req() req: any, @Query() query: any) {
    return this.chartOfAccountsUseCases.findAll(req.tenant.id, query);
  }

  @Get('chart-of-accounts/tree')
  @ApiOperation({ summary: 'Retorna o plano de contas formatado em árvore' })
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  getChartOfAccountsTree(@Req() req: any) {
    return this.chartOfAccountsUseCases.getTree(req.tenant.id);
  }

  // --- LANÇAMENTOS FINANCEIROS ---
  @Post('transactions')
  @RequirePermissions({ module: 'faturamento', action: 'criar' })
  createTransaction(@Req() req: any, @Body() dto: CreateTransactionDto) {
    // 🔥 BLINDAGEM: Garante a extração do ID do usuário, não importa o formato do Token
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    if (!userId) throw new BadRequestException('Erro de Autenticação: ID do usuário não encontrado no Token.');
    
    return this.transactionUseCases.create(req.tenant.id, userId, dto);
  }

  @Get('transactions')
  @TransformResponse()
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findAllTransactions(@Req() req: any, @Query() query: QueryTransactionsDto) {
    return this.transactionUseCases.findAll(req.tenant.id, query);
  }

  @Get('transactions/:id')
  @RequirePermissions({ module: 'faturamento', action: 'visualizar' })
  findOneTransaction(@Req() req: any, @Param('id') id: string) {
    return this.transactionUseCases.findOne(id, req.tenant.id);
  }

  @Patch('transactions/:id/approve')
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  approveTransaction(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id || req.user?.sub || req.user?.userId;
    return this.transactionUseCases.approve(id, req.tenant.id, userId);
  }

  @Patch('transactions/:id/pay')
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  payTransaction(@Req() req: any, @Param('id') id: string, @Body() dto: PayTransactionDto) {
    return this.transactionUseCases.pay(id, req.tenant.id, dto);
  }

  @Patch('transactions/:id/cancel')
  @RequirePermissions({ module: 'faturamento', action: 'editar' })
  cancelTransaction(@Req() req: any, @Param('id') id: string) {
    return this.transactionUseCases.cancel(id, req.tenant.id);
  }

  @Delete('transactions/:id')
  @RequirePermissions({ module: 'faturamento', action: 'excluir' })
  removeTransaction(@Req() req: any, @Param('id') id: string) {
    return this.transactionUseCases.remove(id, req.tenant.id);
  }
}