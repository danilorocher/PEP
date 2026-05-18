export class FinancialTransaction {
  constructor(
    public id: string,
    public tenantId: string,
    public tipo: 'RECEITA' | 'DESPESA',
    public natureza: 'CONVENIO' | 'PARTICULAR' | 'SUS' | 'CUSTO_OPERACIONAL' | 'SALARIO' | 'OUTROS',
    public chartAccountId: string,
    public costCenterId: string | null,
    public descricao: string,
    public valor: number,
    public dataCompetencia: Date,
    public dataVencimento: Date | null,
    public dataPagamento: Date | null,
    public status: 'PENDENTE' | 'APROVADO' | 'PAGO' | 'CANCELADO',
    public origemTipo: string | null,
    public origemId: string | null,
    public numeroDocumento: string | null,
    public formaPagamento: 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'TED' | 'DOC' | 'CHEQUE' | 'CONVENIO' | 'SUS' | null,
    public observacoes: string | null,
    public criadoPorId: string,
    public aprovadoPorId: string | null,
    public aprovadoEm: Date | null,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null
  ) {}
}