import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionFlagsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() criar?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() editar?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() visualizar?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() excluir?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() solicitar?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() liberar?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() admitir?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() alta?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() administrar?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() cancelar?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'ENFERMEIRO_CHEFE' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    example: {
      pacientes: { criar: true, editar: true, visualizar: true, excluir: false },
      prontuario: { visualizar: true, editar: false }
    },
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/PermissionFlagsDto' }
  })
  @IsObject()
  @IsNotEmpty()
  permissoes: Record<string, PermissionFlagsDto>;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}