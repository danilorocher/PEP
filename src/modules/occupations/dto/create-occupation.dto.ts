import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class CreateOccupationDto {
  @ApiProperty() @IsString() @IsNotEmpty() nome: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() codigoCBO?: string;
  
  // 🔥 Deve aceitar os tipos base para o roteamento do frontend
  @ApiProperty({ enum: ['MEDICO', 'ENFERMEIRO', 'ADMINISTRATIVO'] })
  @IsString() @IsNotEmpty() @IsIn(['MEDICO', 'ENFERMEIRO', 'ADMINISTRATIVO'])
  tipoBase: string; 
}