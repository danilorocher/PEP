import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';

export interface TenantRequest extends Request {
  tenant: {
    id: string;
    subdomain: string;
  };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;

    if (!host) {
      throw new BadRequestException('Host header é obrigatório.');
    }

    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]{1,5})?$/.test(host);
    
    if (isIpAddress || host.startsWith('localhost')) {
      throw new BadRequestException('Acesso direto por IP ou localhost puro não é permitido.');
    }

    const subdomain = host.split('.')[0];

    if (!subdomain) {
      throw new BadRequestException('Subdomínio não identificado.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true, subdomain: true, isActive: true }
    });

    if (!tenant) {
      throw new UnauthorizedException('Tenant não encontrado.');
    }

    if (!tenant.isActive) {
      throw new UnauthorizedException('Tenant inativo.');
    }

    (req as any).tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
    };

    next();
  }
}