import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsInt, IsDateString, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePrescriptionItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  dosagem: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  viaAdministracao: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  frequencia: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  horariosProgramados: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  duracaoDias?: number;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  dataInicio: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hospitalizationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  assinadaDigitalmente?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assinaturaHash?: string;

  @ApiProperty({ type: [CreatePrescriptionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrescriptionItemDto)
  items: CreatePrescriptionItemDto[];
}

export class SuspendPrescriptionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  observacao: string;
}