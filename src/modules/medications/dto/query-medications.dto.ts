import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../shared/dto/pagination.dto';

export class QueryMedicationsDto extends PaginationDto {
  @ApiPropertyOptional() @IsString() @IsOptional() formaFarmaceutica?: string;
  @ApiPropertyOptional() @IsBoolean() @IsOptional() 
  @Transform(({ value }) => value === 'true') controleEspecial?: boolean;
}