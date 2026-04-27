import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsIn } from 'class-validator';

export class CreateExamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: ['LABORATORIAL', 'IMAGEM', 'FUNCIONAL', 'OUTRO'] })
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  tempoMedioResultado?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preparacaoNecessaria?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  codigoInterno?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codigoTUSS: string;
}

export class UpdateExamDto extends PartialType(CreateExamDto) {
  @ApiProperty({ required: false, enum: ['ATIVO', 'INATIVO'] })
  @IsOptional()
  @IsString()
  @IsIn(['ATIVO', 'INATIVO'])
  status?: string;
}