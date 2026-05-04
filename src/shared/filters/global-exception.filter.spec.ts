import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockStatus: jest.Mock;
  let mockJson: jest.Mock;
  let mockArgumentsHost: Partial<ArgumentsHost>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test', method: 'GET', requestId: '123' }),
      }),
    };
  });

  it('deve retornar 409 para erro Prisma P2002 (Unique)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Erro', { code: 'P2002', clientVersion: '1' });
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(409);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 409,
      error: 'CONFLICT',
      message: 'Já existe um registro com esses dados',
      requestId: '123'
    }));
  });

  it('deve retornar 404 para erro Prisma P2025 (Not Found)', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Erro', { code: 'P2025', clientVersion: '1' });
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404 }));
  });

  it('deve retornar formato padrão para HttpExceptions', () => {
    const error = new HttpException('Acesso Negado', HttpStatus.FORBIDDEN);
    filter.catch(error, mockArgumentsHost as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({ message: 'Acesso Negado' }));
  });
});