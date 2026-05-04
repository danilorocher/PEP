import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max, IsEnum } from 'class-validator';

export enum OrderDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Página atual (padrão: 1)', minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página (padrão: 10)', minimum: 1, maximum: 100, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Proteção contra requisições abusivas (DDoS)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Termo de busca textual genérica' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Campo para ordenação', default: 'createdAt' })
  @IsString()
  @IsOptional()
  orderBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: OrderDirection, default: OrderDirection.DESC })
  @IsEnum(OrderDirection)
  @IsOptional()
  order?: OrderDirection = OrderDirection.DESC;
}