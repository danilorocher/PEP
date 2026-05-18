import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum AccountingType { RECEITA = 'RECEITA', DESPESA = 'DESPESA', ATIVO = 'ATIVO', PASSIVO = 'PASSIVO' }
export enum AccountNature { DEVEDORA = 'DEVEDORA', CREDORA = 'CREDORA' }

export class CreateChartOfAccountsDto {
  @ApiProperty({ example: '3.1.1' })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({ example: 'Receitas de Convênios' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ enum: AccountingType })
  @IsEnum(AccountingType)
  tipo: AccountingType;

  @ApiProperty({ enum: AccountNature })
  @IsEnum(AccountNature)
  natureza: AccountNature;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  codigoPai?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  aceitaLancamento?: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descricao?: string;
}

export class UpdateChartOfAccountsDto extends PartialType(CreateChartOfAccountsDto) {}