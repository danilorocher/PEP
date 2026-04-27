import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class AdministerMedicationDto {
  @ApiProperty({ enum: ['MINISTRADO', 'RECUSADO_PACIENTE'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['MINISTRADO', 'RECUSADO_PACIENTE'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  observacoes?: string;
}