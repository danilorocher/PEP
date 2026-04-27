import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'ENFERMEIRO_CHEFE' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    example: {
      pacientes: { criar: true, editar: true, visualizar: true, excluir: false },
      prontuario: { visualizar: true, editar: false }
    }
  })
  @IsObject()
  @IsNotEmpty()
  permissoes: Record<string, any>;
}

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}