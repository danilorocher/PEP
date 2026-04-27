export class PrescriptionItem {
  constructor(
    public readonly id: string,
    public readonly prescriptionId: string,
    public readonly medicationId: string,
    public readonly dosagem: string,
    public readonly viaAdministracao: string,
    public readonly frequencia: string,
    public readonly horariosProgramados: string[],
    public readonly duracaoDias: number | null,
    public readonly dataInicio: Date,
    public readonly dataFim: Date | null,
    public readonly observacoes: string | null,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}