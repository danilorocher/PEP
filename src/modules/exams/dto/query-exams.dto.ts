import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryExamsDto extends PaginationDto {
  @ApiPropertyOptional() @IsString() @IsOptional() tipo?: string;
}