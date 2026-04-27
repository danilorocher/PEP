import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateBillingItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  procedimentoDescricao: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codigoTUSS: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantidade: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  valorUnitario: number;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  examId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  medicationId?: string;
}

export class GlossItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motivoGlosa: string;
}