import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBillingItemDto } from './billing-item.dto';

export enum BillingType {
  INTERNACAO = 'INTERNACAO',
  CONSULTA = 'CONSULTA',
  SADT = 'SADT'
}

export enum BillingGuideStatus {
  RASCUNHO = 'RASCUNHO',
  ENVIADA = 'ENVIADA',
  AUTORIZADA = 'AUTORIZADA',
  NEGADA = 'NEGADA',
  PAGA = 'PAGA',
  GLOSADA = 'GLOSADA'
}

export class CreateBillingGuideDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  convenioId: string;

  @ApiProperty({ enum: BillingType })
  @IsEnum(BillingType)
  @IsNotEmpty()
  tipo: BillingType;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  hospitalizationId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  appointmentId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  numeroGuia?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;

  @ApiProperty({ type: [CreateBillingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBillingItemDto)
  items: CreateBillingItemDto[];
}

export class UpdateBillingGuideStatusDto {
  @ApiProperty({ enum: BillingGuideStatus })
  @IsEnum(BillingGuideStatus)
  @IsNotEmpty()
  status: BillingGuideStatus;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataAutorizacao?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  codigoAutorizacao?: string;
}