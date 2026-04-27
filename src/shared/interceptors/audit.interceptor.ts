import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, tenant, ip } = req;
    const userId = user?.id || 'ANONIMO';
    const tenantId = tenant?.subdomain || 'N/A';
    
    // Ignora rotas de GET (leitura) para não poluir os logs, audita apenas mutações
    if (method === 'GET') return next.handle();

    return next.handle().pipe(
      tap(() => {
        // Futuramente isso pode ser enviado para a fila do BullMQ (Módulo Audit)
        this.logger.log(`[AUDIT] Tenant:${tenantId} | User:${userId} | IP:${ip} | Ação:${method} ${url}`);
      }),
    );
  }
}