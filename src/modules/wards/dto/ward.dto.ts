import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateWardDto {
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiProperty() @IsString() @IsNotEmpty() tipo: string;
  @ApiProperty() @IsInt() @Min(1) capacidade: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() andar?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() status?: string;
}

export class UpdateWardDto extends PartialType(CreateWardDto) {}