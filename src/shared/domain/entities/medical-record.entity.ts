export class MedicalRecord {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly numero: string,
    public readonly status: string,
    public readonly responsavelAberturaId: string | null,
    public readonly abertoEm: Date,
    public readonly fechadoEm: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}