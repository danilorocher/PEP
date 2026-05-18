export class CostCenter {
  constructor(
    public id: string,
    public tenantId: string,
    public codigo: string,
    public nome: string,
    public tipo: 'CLINICO' | 'ADMINISTRATIVO' | 'APOIO',
    public codigoPai: string | null,
    public ativo: boolean,
    public descricao: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null
  ) {}
}