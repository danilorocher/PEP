import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryExamRequestsDto extends PaginationDto {
  @ApiPropertyOptional() @IsString() @IsOptional() patientId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() dataInicial?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() dataFinal?: string;
}