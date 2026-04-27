export class Bed {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly wardId: string,
    public readonly numero: string,
    public readonly tipo: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}