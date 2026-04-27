export class Role {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly nome: string,
    public readonly permissoes: any,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}