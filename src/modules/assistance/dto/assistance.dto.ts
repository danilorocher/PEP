import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, Max, IsEnum } from 'class-validator';
import { FluidEntryType, FluidOutputType } from '@prisma/client';

// --- SINAIS VITAIS ---
export class CreateVitalSignDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() hospitalizationId?: string;

  @ApiProperty() @IsNumber() @IsNotEmpty() systolicPressure: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() diastolicPressure: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() temperature: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() heartRate: number;
  @ApiProperty() @IsNumber() @IsNotEmpty() respiratoryRate: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(100) @IsNotEmpty() spo2: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(10) @IsNotEmpty() painScale: number;
  
  @ApiProperty({ required: false }) @IsString() @IsOptional() observacoes?: string;
}

// --- BALANÇO HÍDRICO ---
export class CreateFluidBalanceDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() hospitalizationId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() dataHoraReferencia: string; // ISO String
}

export class AddFluidEntryDto {
  @ApiProperty({ enum: FluidEntryType }) @IsEnum(FluidEntryType) @IsNotEmpty() tipo: FluidEntryType;
  @ApiProperty() @IsNumber() @Min(0) @IsNotEmpty() volumeMl: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() descricao?: string;
}

export class AddFluidOutputDto {
  @ApiProperty({ enum: FluidOutputType }) @IsEnum(FluidOutputType) @IsNotEmpty() tipo: FluidOutputType;
  @ApiProperty() @IsNumber() @Min(0) @IsNotEmpty() volumeMl: number;
  @ApiProperty({ required: false }) @IsString() @IsOptional() descricao?: string;
}

// --- ESCALAS DE RISCO ---
export class CreateBradenDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() hospitalizationId?: string;

  @ApiProperty() @IsNumber() @Min(1) @Max(4) @IsNotEmpty() sensoryPerception: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(4) @IsNotEmpty() moisture: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(4) @IsNotEmpty() activity: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(4) @IsNotEmpty() mobility: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(4) @IsNotEmpty() nutrition: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(3) @IsNotEmpty() frictionShear: number;
}

export class CreateMorseDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() hospitalizationId?: string;

  @ApiProperty() @IsNumber() @IsNotEmpty() historyOfFalling: number; // 0 ou 25
  @ApiProperty() @IsNumber() @IsNotEmpty() secondaryDiagnosis: number; // 0 ou 15
  @ApiProperty() @IsNumber() @IsNotEmpty() ambulatoryAid: number; // 0, 15 ou 30
  @ApiProperty() @IsNumber() @IsNotEmpty() ivTherapy: number; // 0 ou 20
  @ApiProperty() @IsNumber() @IsNotEmpty() gait: number; // 0, 10 ou 20
  @ApiProperty() @IsNumber() @IsNotEmpty() mentalStatus: number; // 0 ou 15
}

export class CreateGlasgowDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() hospitalizationId?: string;

  @ApiProperty() @IsNumber() @Min(1) @Max(4) @IsNotEmpty() eyeOpening: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(5) @IsNotEmpty() verbalResponse: number;
  @ApiProperty() @IsNumber() @Min(1) @Max(6) @IsNotEmpty() motorResponse: number;
  @ApiProperty({ required: false }) @IsNumber() @IsOptional() pupilReactivity?: number;
}