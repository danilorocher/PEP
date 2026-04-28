import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
 
export enum ExamType {
  LABORATORIAL = 'LABORATORIAL',
  IMAGEM = 'IMAGEM',
  FUNCIONAL = 'FUNCIONAL',
  OUTRO = 'OUTRO',
}
 
export enum EntityStatus {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}
 
export class CreateExamDto {
  @ApiProperty({ example: 'Hemograma Completo' })
  @IsString()
  nome: string;
 
  @ApiProperty({ enum: ExamType })
  @IsEnum(ExamType)
  tipo: ExamType;
 
  @ApiPropertyOptional({ example: 24, description: 'Tempo médio em horas' })
  @IsOptional()
  @IsInt()
  tempoMedioResultado?: number;
 
  @ApiPropertyOptional({ example: 'Jejum de 8 horas' })
  @IsOptional()
  @IsString()
  preparacaoNecessaria?: string;
 
  @ApiPropertyOptional({ example: 'EX-001' })
  @IsOptional()
  @IsString()
  codigoInterno?: string;
 
  @ApiPropertyOptional({ example: '40304361', description: 'Código TUSS obrigatório para convênios' })
  @IsOptional()
  @IsString()
  codigoTUSS?: string;
 
  @ApiPropertyOptional({ enum: EntityStatus })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
 
export class UpdateExamDto extends PartialType(CreateExamDto) {}
