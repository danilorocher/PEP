import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { requestContext } from '../context/request.context';

export interface Response<T> {
  success: boolean;
  data: T;
  meta: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        const store = requestContext.getStore();
        const requestId = store?.get('requestId') || context.switchToHttp().getRequest().requestId;

        // Se for uma lista paginada (já traz data, total, page, etc)
        if (data && data.data && typeof data.total === 'number') {
          const { data: items, ...meta } = data;
          return {
            success: true,
            data: items,
            meta: { ...meta, timestamp: new Date().toISOString(), requestId }
          };
        }

        // Resposta padrão
        return {
          success: true,
          data,
          meta: { timestamp: new Date().toISOString(), requestId }
        };
      }),
    );
  }
}

// 🔥 DECORATOR SEGURO: Use @TransformResponse() nos seus controllers novos
export function TransformResponse() {
  return UseInterceptors(TransformInterceptor);
}