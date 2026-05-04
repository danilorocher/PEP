import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryNursesDto extends PaginationDto {
  @ApiPropertyOptional() @IsString() @IsOptional() categoria?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() status?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() 
  @Transform(({ value }) => value === 'true') podePrescrever?: boolean;
}