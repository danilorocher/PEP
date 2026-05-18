export class ChartOfAccounts {
  constructor(
    public id: string,
    public tenantId: string,
    public codigo: string,
    public nome: string,
    public tipo: 'RECEITA' | 'DESPESA' | 'ATIVO' | 'PASSIVO',
    public natureza: 'DEVEDORA' | 'CREDORA',
    public codigoPai: string | null,
    public aceitaLancamento: boolean,
    public ativo: boolean,
    public descricao: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null
  ) {}
}