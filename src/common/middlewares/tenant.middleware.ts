import { Injectable, NestMiddleware, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { getTenantPrisma, TenantPrismaClient } from '../../shared/infrastructure/database/prisma/prisma-tenant.service';

export interface TenantRequest extends Request {
  tenant: {
    id: string;
    subdomain: string;
  };
  prismaSafe?: TenantPrismaClient;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. PASSE LIVRE PARA CORS
    if (req.method === 'OPTIONS') {
      return next();
    }

    // 2. LEITURA INTELIGENTE DA ROTA
    const urlString = String(req.originalUrl || req.url || req.path || '');
    const isPublicRoute = urlString.includes('/auth/login') || urlString.includes('/auth/refresh');

    const hostWithPort = req.headers.host || '';
    const host = hostWithPort.split(':')[0]; 

    if (!host) {
      throw new BadRequestException('Host header é obrigatório.');
    }

    // 🔥 CORREÇÃO: Identifica automaticamente se o host é um IP da rede (Ex: 192.168.X.X, 10.0.X.X)
    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host);
    const isLocalhost = host === 'localhost' || isIpAddress;
    
    let subdomain = host.split('.')[0];

    // Se estiver a aceder via localhost ou IP de rede, lê o hospital correto da "porta secreta"
    if (isLocalhost) {
      subdomain = (req.headers['x-tenant-subdomain'] as string) || '';
    }

    // 3. AVALIAÇÃO DA ROTA PÚBLICA
    if (!subdomain) {
      if (isPublicRoute) {
        (req as any).tenant = { id: 'GLOBAL_AUTH', subdomain: 'global' };
        return next();
      }
      this.logger.warn(`Acesso bloqueado (Sem Tenant): ${req.method} ${urlString}`);
      throw new UnauthorizedException('Unidade (Hospital) não especificada na requisição.');
    }

    // 4. BLINDAGEM DE ACESSO (Row-Level Security)
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

    (req as any).prismaSafe = getTenantPrisma(this.prisma, tenant.id);

    next();
  }
}