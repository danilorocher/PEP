import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// Caminho corrigido para a Clean Architecture
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';

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
    const host = req.headers.host; // ex: clinica-abc.pep.com:3000 ou 192.168.1.10:3000

    if (!host) {
      throw new BadRequestException('Host header é obrigatório.');
    }

    // Detecção rápida para acessos diretos via IP (IPv4 com ou sem porta)
    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]{1,5})?$/.test(host);
    
    if (isIpAddress || host.startsWith('localhost')) {
      throw new BadRequestException('Acesso direto por IP ou localhost puro não é permitido. Utilize um subdomínio de tenant.');
    }

    // Extrai o subdomínio. Exemplo: clinica-abc.pep.com -> clinica-abc
    const subdomain = host.split('.')[0];

    if (!subdomain) {
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