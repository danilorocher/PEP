import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { requestContext } from '../context/request.context';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const store = requestContext.getStore();
    const requestId = store?.get('requestId') || request.requestId || 'unknown-request-id';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'INTERNAL_SERVER_ERROR';
    let message: string | any = 'Ocorreu um erro interno no servidor.';
    let details: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      error = res.error || HttpStatus[status];
      message = res.message || exception.message;
      
      // Tratamento para ValidationError (class-validator)
      if (Array.isArray(res.message)) {
        message = 'Dados de entrada inválidos';
        details = res.message;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          error = 'CONFLICT';
          message = 'Já existe um registro com esses dados';
          details = [`Campo(s) duplicado(s): ${(exception.meta?.target as string[])?.join(', ')}`];
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          error = 'NOT_FOUND';
          message = 'Registro não encontrado';
          break;
        case 'P2003':
          status = HttpStatus.BAD_REQUEST;
          error = 'FOREIGN_KEY_VIOLATION';
          message = 'Referência inválida';
          break;
        case 'P2014':
          status = HttpStatus.BAD_REQUEST;
          error = 'RELATION_VIOLATION';
          message = 'Violação de relacionamento. O registro está atrelado a outras informações.';
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'PRISMA_VALIDATION_ERROR';
      message = 'Erro de validação nos dados enviados ao banco de dados.';
    }

    // Log detalhado apenas se for 500
    if (status >= 500) {
      this.logger.error(`[Request: ${requestId}] ${request.method} ${request.url}`, (exception as Error).stack);
    }

    // Response no formato exato solicitado
    response.status(status).json({
      statusCode: status,
      error,
      message,
      details: details.length > 0 ? details : undefined,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    });
  }
}