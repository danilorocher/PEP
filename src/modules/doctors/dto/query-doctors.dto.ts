import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryDoctorsDto extends PaginationDto {
  @ApiPropertyOptional() @IsString() @IsOptional() specialtyId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
}