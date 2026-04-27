import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, IsDateString } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty() @IsString() @IsNotEmpty() patientId: string;
  @ApiProperty() @IsString() @IsNotEmpty() doctorId: string;
  @ApiProperty() @IsString() @IsNotEmpty() specialtyId: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() dataHora: string;
  @ApiProperty() @IsInt() @Min(1) duracao: number; // minutos
  @ApiProperty() @IsString() @IsNotEmpty() tipo: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() convenioId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() observacoes?: string;
}

export class CancelAppointmentDto {
  @ApiProperty() @IsString() @IsNotEmpty() motivoCancelamento: string;
}

export class FinishAppointmentDto {
  @ApiProperty({ description: 'Obrigatório para o faturamento e histórico clínico' }) 
  @IsString() @IsNotEmpty() cid10Id: string;
}