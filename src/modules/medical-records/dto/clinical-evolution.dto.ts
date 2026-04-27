import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateClinicalEvolutionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cid10Id?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hospitalizationId?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  assinadoDigitalmente?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assinaturaHash?: string;
}

export class UpdateClinicalEvolutionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cid10Id?: string;
}