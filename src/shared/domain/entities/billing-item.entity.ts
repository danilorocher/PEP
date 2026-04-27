export class BillingItem {
  constructor(
    public readonly id: string,
    public readonly billingGuideId: string,
    public readonly procedimentoDescricao: string,
    public readonly codigoTUSS: string,
    public readonly quantidade: number,
    public readonly valorUnitario: number,
    public readonly valorTotal: number,
    public readonly status: string,
    public readonly examId?: string | null,
    public readonly medicationId?: string | null,
    public readonly motivoGlosa?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}