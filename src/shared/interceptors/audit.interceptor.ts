import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../infrastructure/database/prisma/repositories/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  // Injeção do Prisma para salvar o log real no banco de dados
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, tenant, ip } = req;
    
    // Ignora rotas de GET e OPTIONS para não poluir os logs, audita apenas mutações
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
        
        // Salva o log de auditoria no banco de dados
        if (tenantId && userId) {
          try {
            await this.prisma.auditLog.create({
              data: {
                tenantId,
                userId,
                acao: `${method} ${url}`,
                entidade: url.split('/')[1] || 'geral', // Extrai a entidade da URL (ex: api/users -> users)
                entidadeId: req.params?.id || 'N/A',
                dadosNovos: body ? JSON.parse(JSON.stringify(body)) : null,
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