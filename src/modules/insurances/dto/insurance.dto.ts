import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { InsuranceType, EntityStatus } from '@prisma/client';

export class CreateInsuranceDto {
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registroANS?: string;
  @ApiProperty({ enum: InsuranceType }) @IsEnum(InsuranceType) tipo: InsuranceType;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ enum: EntityStatus }) @IsOptional() @IsEnum(EntityStatus) status?: EntityStatus;
}

export class UpdateInsuranceDto {
  @ApiPropertyOptional() @IsOptional() @IsString() nome?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() registroANS?: string;
  @ApiPropertyOptional({ enum: InsuranceType }) @IsOptional() @IsEnum(InsuranceType) tipo?: InsuranceType;
  @ApiPropertyOptional() @IsOptional() @IsString() telefone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional({ enum: EntityStatus }) @IsOptional() @IsEnum(EntityStatus) status?: EntityStatus;
}