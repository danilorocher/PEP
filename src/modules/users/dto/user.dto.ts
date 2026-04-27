import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsDateString, IsObject } from 'class-validator';

export class CreateUserDto {
  @ApiProperty() @IsString() @IsNotEmpty() roleId: string;
  @ApiProperty() @IsString() @IsNotEmpty() nomeCompleto: string;
  @ApiProperty() @IsString() @IsNotEmpty() cpf: string; // Enviado limpo, criptografado no backend
  @ApiProperty() @IsEmail() @IsNotEmpty() email: string;
  @ApiProperty() @IsOptional() @IsDateString() dataNascimento?: string;
  @ApiProperty() @IsOptional() @IsString() sexo?: string;
  @ApiProperty() @IsOptional() @IsString() telefone?: string;
  @ApiProperty() @IsOptional() @IsObject() enderecoCompleto?: any;
  @ApiProperty() @IsOptional() @IsDateString() dataAdmissao?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty() @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @IsNotEmpty() currentPassword: string;
  @ApiProperty() @IsString() @IsNotEmpty() newPassword: string;
}