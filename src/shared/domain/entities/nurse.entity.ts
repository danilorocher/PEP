export class Nurse {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly userId: string | null,
    public readonly nomeCompleto: string,
    public readonly cpf: string, // Armazenado criptografado
    public readonly coren: string,
    public readonly ufCoren: string,
    public readonly dataExpedicaoCoren: Date | null,
    public readonly categoria: string,
    public readonly cns: string | null, // Armazenado criptografado
    public readonly podePrescrever: boolean,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}