export class Ward {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly nome: string,
    public readonly tipo: string,
    public readonly capacidade: number,
    public readonly andar: string | null,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}