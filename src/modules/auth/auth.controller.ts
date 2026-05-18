import { Controller, Post, Body, Req, Ip } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { LoginUseCase } from '../../shared/application/use-cases/auth/login.use-case';
import { LoginDto } from './dto/login.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @ApiOperation({ summary: 'Realiza login no sistema (Tenant)' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas de login. Conta bloqueada temporariamente.' })
  // 🔥 CORREÇÃO: Aumentamos o limite para 20 requisições por minuto para suportar o Duplo Check-in fluído!
  @Throttle({ default: { limit: 20, ttl: 60000 } }) 
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
  ) {
    const tenantId = req.tenant.id;
    return this.loginUseCase.execute(tenantId, ip, loginDto);
  }
}