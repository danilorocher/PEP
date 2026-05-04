import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsEnum, IsArray, IsOptional, IsNumber } from 'class-validator';
import { LabExamCategory } from '@prisma/client';

export class CreateLabExamDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty({ enum: LabExamCategory }) @IsEnum(LabExamCategory) category: LabExamCategory;
  @ApiPropertyOptional() @IsString() @IsOptional() unit?: string;
  @ApiPropertyOptional() @IsOptional() referenceRangeMale?: any;
  @ApiPropertyOptional() @IsOptional() referenceRangeFemale?: any;
  @ApiPropertyOptional() @IsNumber() @IsOptional() criticalMin?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() criticalMax?: number;
}

export class CreateLabOrderDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() medicalRecordId?: string;
  @ApiPropertyOptional() @IsUUID() @IsOptional() hospitalizationId?: string;
  @ApiProperty({ type: [String], description: 'Lista de IDs de LabExam' })
  @IsArray() @IsUUID(undefined, { each: true }) examIds: string[];
}

export class CollectSampleDto {
  @ApiProperty() @IsString() @IsNotEmpty() sampleType: string; // EX: SANGUE, URINA
}

export class UpdateLabResultDto {
  @ApiProperty() @IsString() @IsNotEmpty() value: string;
}

export class SignReportDto {
  @ApiProperty() @IsString() @IsNotEmpty() reportText: string;
}