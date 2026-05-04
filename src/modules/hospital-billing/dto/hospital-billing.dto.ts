import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, Min, IsUUID } from 'class-validator';
import { AccountItemType, SourceModule, SUSBillingType, DenialStatus } from '@prisma/client';

export class RecordConsumptionDto {
  @ApiProperty() @IsUUID() @IsNotEmpty() patientId: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() hospitalizationId?: string;
  @ApiProperty({ required: false }) @IsUUID() @IsOptional() appointmentId?: string;
  
  @ApiProperty({ enum: AccountItemType }) @IsEnum(AccountItemType) @IsNotEmpty() tipo: AccountItemType;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty() @IsNumber() @Min(0.1) @IsNotEmpty() quantity: number;
  @ApiProperty() @IsNumber() @Min(0) @IsNotEmpty() unitPrice: number;
  
  @ApiProperty({ required: false }) @IsString() @IsOptional() referenceId?: string;
  @ApiProperty({ enum: SourceModule }) @IsEnum(SourceModule) @IsNotEmpty() sourceModule: SourceModule;
}

export class GenerateSUSBillingDto {
  @ApiProperty({ enum: SUSBillingType }) @IsEnum(SUSBillingType) @IsNotEmpty() type: SUSBillingType;
}

export class RegisterDenialDto {
  @ApiProperty() @IsString() @IsNotEmpty() reason: string;
  @ApiProperty() @IsNumber() @Min(0.01) @IsNotEmpty() amountDenied: number;
}

export class AppealDenialDto {
  @ApiProperty() @IsString() @IsNotEmpty() justification: string;
}

export class AssignDRGDto {
  @ApiProperty() @IsString() @IsNotEmpty() code: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty() @IsNumber() @Min(0) @IsNotEmpty() averageCost: number;
}