import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString } from 'class-validator';

export class CreateNurseDto {
  @ApiProperty() @IsString() @IsNotEmpty() nomeCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() cpf: string;
  @ApiProperty() @IsString() @IsNotEmpty() coren: string;
  @ApiProperty() @IsString() @IsNotEmpty() ufCoren: string;
  @ApiProperty() @IsString() @IsNotEmpty() categoria: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() userId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dataExpedicaoCoren?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cns?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() podePrescrever?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() status?: string;
}

export class UpdateNurseDto extends PartialType(CreateNurseDto) {}