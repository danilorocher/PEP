import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { InteractionSeverity, ControlledOperation } from '@prisma/client';

export class AddStockDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() medicationId: string;
  @ApiProperty() @IsString() @IsNotEmpty() lote: string;
  @ApiProperty() @IsString() @IsNotEmpty() validade: string; // ISO DateTime
  @ApiProperty() @IsNumber() @IsNotEmpty() quantidade: number;
  @ApiProperty() @IsString() @IsNotEmpty() localizacao: string;
}

class DispensationItemDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() prescriptionItemId: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() stockId: string;
  @ApiProperty() @IsNumber() @IsNotEmpty() quantidadeDispensada: number;
}

export class CreateDispensationDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() prescriptionId: string;
  @ApiProperty({ required: false }) @IsString() @IsOptional() observacoes?: string;
  
  @ApiProperty({ type: [DispensationItemDto] }) 
  @IsArray() 
  @ValidateNested({ each: true }) 
  @Type(() => DispensationItemDto) 
  items: DispensationItemDto[];
}

export class CreateInteractionDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() medicationAId: string;
  @ApiProperty() @IsUUID() @IsNotEmpty() medicationBId: string;
  @ApiProperty({ enum: InteractionSeverity }) @IsEnum(InteractionSeverity) @IsNotEmpty() grauSeveridade: InteractionSeverity;
  @ApiProperty() @IsString() @IsNotEmpty() descricao: string;
  @ApiProperty() @IsString() @IsNotEmpty() manejoClinico: string;
}