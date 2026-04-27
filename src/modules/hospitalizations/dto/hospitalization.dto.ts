import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsDateString } from 'class-validator';

export class AdmitPatientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bedId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  wardId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicoResponsavelId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cid10AdmissaoId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  convenioId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivoInternacao: string;

  @ApiProperty({ enum: ['ELETIVA', 'URGENCIA', 'EMERGENCIA'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ELETIVA', 'URGENCIA', 'EMERGENCIA'])
  tipoInternacao: string;

  @ApiProperty({ enum: ['ENFERMARIA', 'APARTAMENTO', 'UTI'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ENFERMARIA', 'APARTAMENTO', 'UTI'])
  tipoAcomodacao: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroGuiaInternacao?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dataPrevistaAlta?: string;
}

export class DischargePatientDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cid10AltaId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sumarioAlta: string;

  @ApiProperty({ enum: ['ALTA_MELHORADO', 'ALTA_CURADO', 'ALTA_PEDIDO', 'OBITO', 'TRANSFERENCIA'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ALTA_MELHORADO', 'ALTA_CURADO', 'ALTA_PEDIDO', 'OBITO', 'TRANSFERENCIA'])
  condicaoPacienteAlta: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  medicoAltaId?: string;
}