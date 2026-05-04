import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional() @IsString() @IsOptional() roleId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() isActive?: string;
}