import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../infrastructure/database/prisma/repositories/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly sensitiveKeys = [
    'password', 
    'senha', 
    'currentPassword', 
    'newPassword', 
    'token', 
    'accessToken', 
    'refreshToken', 
    'secret'
  ];

  // Adicionado o parâmetro 'seen' (WeakSet) para proteção contra Referências Circulares
  private sanitizeData(data: any, seen = new WeakSet()): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Proteção contra DoS: Se já vimos este objeto, é uma referência circular.
    if (seen.has(data)) {
      return '[Circular Reference]';
    }
    seen.add(data);

    const sanitized = Array.isArray(data) ? [] : {};

    for (const key of Object.keys(data)) {
      if (this.sensitiveKeys.includes(key)) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof data[key] === 'object' && data[key] !== null) {
        sanitized[key] = this.sanitizeData(data[key], seen); // Passa o WeakSet adiante
      } else {
        sanitized[key] = data[key];
      }
    }

    return sanitized;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, tenant, ip } = req;
    
    if (method === 'GET' || method === 'OPTIONS') {
      return next.handle();
    }

    const userId = user?.sub || user?.id || null;
    const tenantId = tenant?.id || null;
    const userAgent = req.headers['user-agent'] || '';
    const body = req.body;

    return next.handle().pipe(
      tap(async () => {
        this.logger.log(`[AUDIT] Tenant:${tenant?.subdomain || 'N/A'} | User:${userId || 'ANONIMO'} | IP:${ip} | Ação:${method} ${url}`);
        
        if (tenantId && userId) {
          try {
            // Sanitiza os dados já com a proteção contra estouro de pilha
            const safeBody = body ? this.sanitizeData(body) : null;
            
            await this.prisma.auditLog.create({
              data: {
                tenantId,
                userId,
                acao: `${method} ${url}`,
                entidade: url.split('/')[1] || 'geral',
                entidadeId: req.params?.id || 'N/A',
                // O safeBody já está tratado, não precisamos mais do JSON.stringify perigoso. 
                // Basta forçar o casting para não quebrar a tipagem do Prisma se necessário.
                dadosNovos: safeBody,
                ip,
                userAgent,
              }
            });
          } catch (error) {
            this.logger.error(`Erro ao salvar AuditLog no banco de dados: ${error.message}`);
          }
        }
      }),
    );
  }
}