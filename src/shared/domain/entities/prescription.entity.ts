export class Prescription {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly medicalRecordId: string,
    public readonly hospitalizationId: string | null,
    public readonly prescritoPor: string,
    public readonly tipoPrescrito: string,
    public readonly dataHora: Date,
    public readonly status: string,
    public readonly observacoes: string | null,
    public readonly assinadaDigitalmente: boolean,
    public readonly assinaturaHash: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}