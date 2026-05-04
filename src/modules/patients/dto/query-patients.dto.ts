import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryPatientsDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filtrar por parte do nome do paciente' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({ description: 'Filtrar por CPF exato ou parcial' })
  @IsString()
  @IsOptional()
  cpf?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo ID do Convênio (Insurance)' })
  @IsString()
  @IsOptional()
  convenioId?: string;

  @ApiPropertyOptional({ description: 'Filtrar pelo status do paciente' })
  @IsString()
  @IsOptional()
  status?: string;
}