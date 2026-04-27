export class ClinicalEvolution {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly medicalRecordId: string,
    public readonly profissionalId: string,
    public readonly tipoProfissional: string,
    public readonly descricao: string,
    public readonly versao: number,
    public readonly assinadoDigitalmente: boolean,
    public readonly hospitalizationId: string | null,
    public readonly cid10Id: string | null,
    public readonly assinaturaHash: string | null,
    public readonly dataHora: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}

export class ClinicalEvolutionHistory {
  constructor(
    public readonly id: string,
    public readonly evolutionId: string,
    public readonly versao: number,
    public readonly dadosSnapshot: any,
    public readonly alteradoPor: string,
    public readonly createdAt: Date,
  ) {}
}