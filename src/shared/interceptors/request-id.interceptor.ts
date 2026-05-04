import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto'; // 🔥 Biblioteca NATIVA do Node.js (Sem necessidade de npm install)
import { requestContext } from '../context/request.context';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Gera o UUID nativo ou aproveita se já vier de um Gateway/Proxy
    const requestId = request.headers['x-request-id'] || randomUUID();
    
    // Injeta no request para uso interno e no response header
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);

    // Salva no AsyncLocalStorage
    const store = new Map<string, string>();
    store.set('requestId', requestId);

    return requestContext.run(store, () => next.handle());
  }
}