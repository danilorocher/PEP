import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum CostCenterType { CLINICO = 'CLINICO', ADMINISTRATIVO = 'ADMINISTRATIVO', APOIO = 'APOIO' }

export class CreateCostCenterDto {
  @ApiProperty({ example: '100' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'UTI Adulto' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: CostCenterType })
  @IsEnum(CostCenterType)
  tipo: CostCenterType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  codigoPai?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}

export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}