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
    // 1. Pegamos o host e removemos a porta (ex: "localhost:3000" vira apenas "localhost")
    const hostWithPort = req.headers.host || '';
    const host = hostWithPort.split(':')[0]; 

    if (!host) {
      throw new BadRequestException('Host header é obrigatório.');
    }

    // 2. Identificamos se é um acesso local
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    
    // 3. Pegamos o subdomínio (primeira parte antes do ponto)
    let subdomain = host.split('.')[0];

    // 4. Se for acesso local puro, definimos o tenant como 'admin' por padrão
    // ou tentamos pegar o que o usuário digitou no frontend (enviado via header)
    if (isLocalhost && (subdomain === 'localhost' || subdomain === '127')) {
      subdomain = (req.headers['x-tenant-subdomain'] as string) || 'admin';
    }

    // 5. Busca no banco de dados
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

    next();
  }
}