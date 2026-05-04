import { PaginatedResult } from '../../domain/interfaces/paginated-result.interface';

/**
 * Converte os parâmetros de página e limite para o formato `skip` e `take` do Prisma.
 */
export function buildPaginationQuery(page: number = 1, limit: number = 10): { skip: number; take: number } {
  const validPage = Math.max(1, Number(page) || 1);
  const validLimit = Math.max(1, Math.min(100, Number(limit) || 10)); // Hard limit de 100 para segurança
  
  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
}

/**
 * Constrói o objeto de resposta com os metadados de paginação.
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10
): PaginatedResult<T> {
  const validPage = Math.max(1, Number(page) || 1);
  const validLimit = Math.max(1, Number(limit) || 10);
  const totalPages = Math.ceil(total / validLimit);

  return {
    data,
    total,
    page: validPage,
    limit: validLimit,
    totalPages,
    hasNext: validPage < totalPages,
    hasPrev: validPage > 1,
  };
}