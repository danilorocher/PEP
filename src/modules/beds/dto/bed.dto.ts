import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBedDto {
  @ApiProperty() @IsString() @IsNotEmpty() wardId: string;
  @ApiProperty() @IsString() @IsNotEmpty() numero: string;
  @ApiProperty() @IsString() @IsNotEmpty() tipo: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() status?: string;
}

export class UpdateBedDto extends PartialType(CreateBedDto) {}