import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() subdomain: string;
  @ApiProperty() @IsString() @IsNotEmpty() cnpj: string;
  @ApiProperty() @IsString() @IsNotEmpty() adminName: string;
  @ApiProperty() @IsEmail() @IsNotEmpty() adminEmail: string;
  @ApiProperty() @IsString() @IsNotEmpty() adminPass: string;
  @ApiProperty() @IsString() @IsNotEmpty() adminCpf: string;
}