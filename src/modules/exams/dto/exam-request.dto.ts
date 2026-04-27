import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';

export class CreateExamRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  medicalRecordId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  examId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hospitalizationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cid10Id?: string;

  @ApiProperty({ enum: ['ROTINA', 'URGENTE', 'EMERGENCIA'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ROTINA', 'URGENTE', 'EMERGENCIA'])
  urgencia: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  isConvenio: boolean;
}

export class UpdateExamResultDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  resultado: string;
}