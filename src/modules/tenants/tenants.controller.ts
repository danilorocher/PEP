import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateTenantUseCase } from '../../shared/application/use-cases/tenants/create-tenant.use-case';
import { CreateTenantDto } from './dto/create-tenant.dto';

@ApiTags('Tenants (Empresas/Clínicas)')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly createTenantUseCase: CreateTenantUseCase) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Cadastra uma nova clínica e gera o usuário Master' })
  // Obs: Você pode proteger essa rota para ser acessada apenas
  // pelo admin global do seu sistema (ou liberada caso seja um SaaS self-service)
  create(@Body() dto: CreateTenantDto) {
    return this.createTenantUseCase.execute(dto);
  }
}