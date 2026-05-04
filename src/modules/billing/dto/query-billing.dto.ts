import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryBillingGuidesDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por convênio específico' })
  @IsString()
  @IsOptional()
  convenioId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status da guia' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Data inicial de emissão (ISO string)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final de emissão (ISO string)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}