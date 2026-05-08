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
  // 🔥 Ajuste: CID agora é opcional. Se quiser obrigar, troque @IsOptional() por @IsNotEmpty() e remova a interrogação.
  @ApiProperty({ required: false, description: 'Obrigatório para o faturamento e histórico clínico' }) 
  @IsOptional() 
  @IsString() 
  cid10Id?: string;

  // 🔥 Novo: Backend agora aceita as observações que o médico digita no Frontend
  @ApiProperty({ required: false, description: 'Resumo Clínico / Observações Internas' }) 
  @IsOptional() 
  @IsString() 
  observacoes?: string;
}