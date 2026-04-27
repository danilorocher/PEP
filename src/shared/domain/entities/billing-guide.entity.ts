export class BillingGuide {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly convenioId: string,
    public readonly tipo: string,
    public readonly status: string,
    public readonly hospitalizationId?: string | null,
    public readonly appointmentId?: string | null,
    public readonly numeroGuia?: string | null,
    public readonly dataEmissao?: Date,
    public readonly dataAutorizacao?: Date | null,
    public readonly codigoAutorizacao?: string | null,
    public readonly valorTotal: number = 0,
    public readonly observacoes?: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date | null,
  ) {}
}