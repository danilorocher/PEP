export class Exam {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly nome: string,
    public readonly tipo: string,
    public readonly tempoMedioResultado: number | null,
    public readonly preparacaoNecessaria: string | null,
    public readonly codigoInterno: string | null,
    public readonly codigoTUSS: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}