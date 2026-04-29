import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { getTenantPrisma, TenantPrismaClient } from '../../shared/infrastructure/database/prisma/prisma-tenant.service';

export interface TenantRequest extends Request {
  tenant: {
    id: string;
    subdomain: string;
  };
  prismaSafe: TenantPrismaClient; // 🔥 NOVO: O Prisma Blindado injetado aqui
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const hostWithPort = req.headers.host || '';
    const host = hostWithPort.split(':')[0]; 

    if (!host) {
      throw new BadRequestException('Host header é obrigatório.');
    }

    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    let subdomain = host.split('.')[0];

    if (isLocalhost && (subdomain === 'localhost' || subdomain === '127')) {
      subdomain = (req.headers['x-tenant-subdomain'] as string) || 'admin';
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true, subdomain: true, isActive: true }
    });

    if (!tenant) {
      throw new UnauthorizedException(`Clínica/Tenant "${subdomain}" não encontrado.`);
    }

    if (!tenant.isActive) {
      throw new UnauthorizedException('Tenant inativo.');
    }

    (req as any).tenant = {
      id: tenant.id,
      subdomain: tenant.subdomain,
    };

    // 🔥 MÁGICA: Injeta a instância do Prisma com RLS (Row-Level Security)
    (req as any).prismaSafe = getTenantPrisma(this.prisma, tenant.id);

    next();
  }
}