import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMedicalRecordStatusDto {
  @ApiProperty({ enum: ['ABERTO', 'FECHADO', 'ARQUIVADO'] })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({ required: false, description: 'Justificativa obrigatória se tentar editar prontuário fechado (usado em anotações externas)' })
  @IsOptional()
  @IsString()
  justificativa?: string;
}