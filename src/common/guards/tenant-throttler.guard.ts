import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const req = context.switchToHttp().getRequest();
    
    // Captura o tenantId injetado pelo middleware. Se falhar, usa 'public'
    const tenantId = req.tenant?.id || 'public';
    const ip = req.ip;

    // Retorna a chave composta garantindo Rate Limit por tenant e por IP
    return `${tenantId}:${ip}:${suffix}`;
  }
}