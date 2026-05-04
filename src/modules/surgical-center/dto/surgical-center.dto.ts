import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsEnum, IsBoolean, IsArray, IsObject, ValidateNested, IsDateString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SurgicalPriority } from '@prisma/client';

// --- AGENDAMENTO ---
export class CreateSurgicalScheduleDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() medicalRecordId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() procedimento: string;
  @ApiProperty() @IsDateString() @IsNotEmpty() dataCirurgia: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() salaId: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() cirurgiaoId: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() anestesistaId: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() enfermeiroId: string;
  @ApiProperty({ enum: SurgicalPriority }) @IsEnum(SurgicalPriority) @IsNotEmpty() prioridade: SurgicalPriority;
  @ApiProperty({ required: false }) @IsString() @IsOptional() observacoes?: string;
}

// --- CHECKLIST PRÉ-OPERATÓRIO ---
export class CreatePreOpChecklistDto {
  @ApiProperty() @IsBoolean() @IsNotEmpty() pacienteConfirmado: boolean;
  @ApiProperty() @IsBoolean() @IsNotEmpty() lateralidadeConfirmada: boolean;
  @ApiProperty() @IsBoolean() @IsNotEmpty() jejumConfirmado: boolean;
  @ApiProperty() @IsBoolean() @IsNotEmpty() consentimentoAssinado: boolean;
  @ApiProperty() @IsBoolean() @IsNotEmpty() alergiasVerificadas: boolean;
}

// --- REGISTRO ANESTÉSICO ---
export class CreateAnesthesiaRecordDto {
  @ApiProperty() @IsString() @IsNotEmpty() tipoAnestesia: string;
  @ApiProperty() @IsObject() @IsNotEmpty() drogasUtilizadas: Record<string, any>;
  @ApiProperty() @IsObject() @IsNotEmpty() sinaisVitais: Record<string, any>;
  @ApiProperty() @IsDateString() @IsNotEmpty() inicio: string;
  @ApiProperty({ required: false }) @IsDateString() @IsOptional() fim?: string;
}

// --- RELATÓRIO CIRÚRGICO ---
export class CreateSurgicalReportDto {
  @ApiProperty() @IsString() @IsNotEmpty() descricaoProcedimento: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() intercorrencias?: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() materiaisUtilizados?: string;
}

// --- OPME ---
class OpmeItemDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() opmeId: string;
  @ApiProperty() @IsNumber() @Min(0.1) @IsNotEmpty() quantidade: number;
}

export class RegisterOpmeUsageDto {
  @ApiProperty({ type: [OpmeItemDto] }) 
  @IsArray() 
  @ValidateNested({ each: true }) 
  @Type(() => OpmeItemDto) 
  items: OpmeItemDto[];
}

// --- PÓS-OPERATÓRIO (SRPA) ---
export class CreatePostOpChecklistDto {
  @ApiProperty() @IsString() @IsNotEmpty() nivelConsciencia: string;
  @ApiProperty() @IsNumber() @Min(0) @IsNotEmpty() dor: number;
  @ApiProperty() @IsObject() @IsNotEmpty() sinaisVitais: Record<string, any>;
  @ApiProperty() @IsBoolean() @IsNotEmpty() liberadoAlta: boolean;
}