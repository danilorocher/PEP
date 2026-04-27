import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @ApiProperty() @IsString() @IsNotEmpty() logradouro: string;
  @ApiProperty() @IsString() @IsNotEmpty() numero: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() complemento?: string;
  @ApiProperty() @IsString() @IsNotEmpty() bairro: string;
  @ApiProperty() @IsString() @IsNotEmpty() cidade: string;
  @ApiProperty() @IsString() @IsNotEmpty() uf: string;
  @ApiProperty() @IsString() @IsNotEmpty() cep: string;
}

export class CreateUserDto {
  @ApiProperty() @IsString() @IsNotEmpty() roleId: string;
  @ApiProperty() @IsString() @IsNotEmpty() nomeCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() cpf: string;
  @ApiProperty() @IsEmail() @IsNotEmpty() email: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dataNascimento?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() sexo?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() telefone?: string;
  
  @ApiProperty({ required: false, type: AddressDto }) 
  @IsOptional() 
  @ValidateNested() 
  @Type(() => AddressDto) 
  enderecoCompleto?: AddressDto;
  
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() dataAdmissao?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @IsNotEmpty() currentPassword: string;
  @ApiProperty() @IsString() @IsNotEmpty() newPassword: string;
}