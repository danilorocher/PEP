import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

// Estendendo o tipo Request do Express para incluir o tenant
export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    subdomain: string;
  };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const host = req.headers.host; // ex: clinica-abc.pep.com:3000

    if (!host) {
      throw new BadRequestException('Host header é obrigatório.');
    }

    // Extrai o subdomínio. Exemplo: clinica-abc.pep.com -> clinica-abc
    // Em localhost: clinica-abc.localhost:3000 -> clinica-abc
    const subdomain = host.split('.')[0];

    // Evita queries desnecessárias para rotas internas ou sem subdomínio claro
    if (!subdomain || subdomain === 'localhost' || subdomain === '127') {
      throw new BadRequestException('Subdomínio não identificado.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true, subdomain: true, isActive: true }
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant (Clínica/Hospital) não encontrado.');
    }

    if (!tenant.isActive) {
      throw new UnauthorizedException('Este Tenant está inativo. Contate o suporte PEP+.');
    }

    // Injeta o tenant na requisição para ser usado em Guards, Interceptors e Controllers
    req.tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
    };

    next();
  }
}