import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecialtyDto {
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() codigoCBOS?: string;
}