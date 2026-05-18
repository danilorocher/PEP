import { IsOptional, IsString, IsBooleanString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryCostCentersDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiPropertyOptional()
  @IsBooleanString()
  @IsOptional()
  ativo?: string;
}

export class QueryTransactionsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  tipo?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  natureza?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  chartAccountId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  costCenterId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dataCompetenciaStart?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dataCompetenciaEnd?: string;
}