import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum TransactionType { RECEITA = 'RECEITA', DESPESA = 'DESPESA' }
export enum TransactionNature { CONVENIO = 'CONVENIO', PARTICULAR = 'PARTICULAR', SUS = 'SUS', CUSTO_OPERACIONAL = 'CUSTO_OPERACIONAL', SALARIO = 'SALARIO', OUTROS = 'OUTROS' }
export enum PaymentMethod { DINHEIRO = 'DINHEIRO', CARTAO_CREDITO = 'CARTAO_CREDITO', CARTAO_DEBITO = 'CARTAO_DEBITO', PIX = 'PIX', TED = 'TED', DOC = 'DOC', CHEQUE = 'CHEQUE', CONVENIO = 'CONVENIO', SUS = 'SUS' }

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  tipo: TransactionType;

  @ApiProperty({ enum: TransactionNature })
  @IsEnum(TransactionNature)
  natureza: TransactionNature;

  @ApiProperty({ description: 'ID da Conta Contábil' })
  @IsString()
  @IsNotEmpty()
  chartAccountId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  costCenterId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @ApiProperty({ example: 1500.50 })
  @IsNumber()
  valor: number;

  @ApiProperty()
  @IsDateString()
  dataCompetencia: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  dataVencimento?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  origemTipo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  origemId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  numeroDocumento?: string;

  @ApiProperty({ enum: PaymentMethod, required: false })
  @IsEnum(PaymentMethod)
  @IsOptional()
  formaPagamento?: PaymentMethod;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observacoes?: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class PayTransactionDto {
  @ApiProperty()
  @IsDateString()
  dataPagamento: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  formaPagamento: PaymentMethod;
}