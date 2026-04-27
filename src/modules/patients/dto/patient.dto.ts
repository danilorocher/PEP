import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsDateString, IsObject } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty() @IsString() @IsNotEmpty() nomeCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() cpf: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cns?: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() dataNascimento: string;
  @ApiProperty() @IsString() @IsNotEmpty() sexo: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nomeMae?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nomePai?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() enderecoCompleto?: any;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsObject() contatoEmergencia?: any;
  @ApiProperty({ required: false }) @IsOptional() @IsString() convenioId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() numeroCarteirinha?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dataValidadeCarteirinha?: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) alergias?: string[];
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) comorbidades?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() historicoClinico?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() grupoSanguineo?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() status?: string;
}

export class UpdatePatientDto extends PartialType(CreatePatientDto) {}