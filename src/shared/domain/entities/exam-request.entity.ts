export class ExamRequest {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly medicalRecordId: string,
    public readonly hospitalizationId: string | null,
    public readonly solicitadoPor: string,
    public readonly patientId: string,
    public readonly examId: string,
    public readonly cid10Id: string | null,
    public readonly dataHoraSolicitacao: Date,
    public readonly urgencia: string,
    public readonly status: string,
    public readonly resultado: string | null,
    public readonly dataHoraResultado: Date | null,
    public readonly observacoes: string | null,
    public readonly codigoAutorizacaoConvenio: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}