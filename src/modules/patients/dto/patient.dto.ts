import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from '../../users/dto/user.dto';

export class EmergencyContactDto {
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiProperty() @IsString() @IsNotEmpty() telefone: string;
  @ApiProperty() @IsString() @IsNotEmpty() parentesco: string;
}

export class CreatePatientDto {
  @ApiProperty() @IsString() @IsNotEmpty() nomeCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() cpf: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cns?: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() dataNascimento: string;
  @ApiProperty() @IsString() @IsNotEmpty() sexo: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nomeMae?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() nomePai?: string;
  
  @ApiProperty({ required: false, type: AddressDto }) 
  @IsOptional() 
  @ValidateNested() 
  @Type(() => AddressDto) 
  enderecoCompleto?: AddressDto;
  
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefone?: string;
  
  @ApiProperty({ required: false, type: EmergencyContactDto }) 
  @IsOptional() 
  @ValidateNested() 
  @Type(() => EmergencyContactDto) 
  contatoEmergencia?: EmergencyContactDto;
  
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