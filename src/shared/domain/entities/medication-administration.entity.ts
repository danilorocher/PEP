export class MedicationAdministration {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly prescriptionItemId: string,
    public readonly hospitalizationId: string | null,
    public readonly administradoPor: string | null,
    public readonly dataHoraProgamada: Date,
    public readonly dataHoraAdministrada: Date | null,
    public readonly status: string,
    public readonly observacoes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}