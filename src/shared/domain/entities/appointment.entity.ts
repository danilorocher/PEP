export class Appointment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly patientId: string,
    public readonly doctorId: string,
    public readonly specialtyId: string,
    public readonly dataHora: Date,
    public readonly duracao: number, // em minutos
    public readonly tipo: string,
    public readonly status: string,
    public readonly motivoCancelamento: string | null,
    public readonly convenioId: string | null,
    public readonly numeroGuiaConsulta: string | null,
    public readonly cid10Id: string | null,
    public readonly observacoes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}