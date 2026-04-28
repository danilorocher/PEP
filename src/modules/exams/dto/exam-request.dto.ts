import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
 
export enum UrgencyType {
  ROTINA = 'ROTINA',
  URGENTE = 'URGENTE',
  EMERGENCIA = 'EMERGENCIA',
}
 
export class CreateExamRequestDto {
  @ApiProperty() @IsUUID() medicalRecordId: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() hospitalizationId?: string;
  @ApiProperty() @IsUUID() patientId: string;
  @ApiProperty() @IsUUID() examId: string;
  @ApiPropertyOptional({ description: 'CID-10 obrigatório para convênios' })
  @IsOptional() @IsUUID() cid10Id?: string;
  @ApiPropertyOptional({ enum: UrgencyType }) @IsOptional() @IsEnum(UrgencyType) urgencia?: UrgencyType;
  @ApiPropertyOptional() @IsOptional() @IsString() observacoes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() codigoAutorizacaoConvenio?: string;
}
 
export class RegisterResultDto {
  @ApiProperty({ description: 'Resultado do exame' })
  @IsString()
  resultado: string;
}
 
export class UpdateExamRequestDto extends PartialType(CreateExamRequestDto) {}
 
// Alias para compatibilidade com o use-case existente
export { RegisterResultDto as UpdateExamResultDto };
