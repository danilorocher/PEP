import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsDateString, IsEmail } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty() @IsString() @IsNotEmpty() nomeCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() cpf: string;
  @ApiProperty() @IsString() @IsNotEmpty() crm: string;
  @ApiProperty() @IsString() @IsNotEmpty() ufCrm: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() userId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dataExpedicaoCrm?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cns?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefoneProfissional?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() emailProfissional?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() registroSecundario?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() status?: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) specialties?: string[];
}

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}