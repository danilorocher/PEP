export class Doctor {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string | null,
    public readonly nomeCompleto: string,
    public readonly cpf: string, // Armazenado criptografado
    public readonly crm: string,
    public readonly ufCrm: string,
    public readonly dataExpedicaoCrm: Date | null,
    public readonly cns: string | null, // Armazenado criptografado
    public readonly telefoneProfissional: string | null,
    public readonly emailProfissional: string | null,
    public readonly registroSecundario: string | null,
    public readonly assinaturaDigitalPath: string | null,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
    public readonly specialties: string[] = [], // IDs das especialidades
  ) {}
}