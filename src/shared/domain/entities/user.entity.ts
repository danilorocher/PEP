export interface Address {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export class User {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly roleId: string,
    public readonly nomeCompleto: string,
    public readonly cpf: string, // Armazenado Criptografado
    public readonly email: string,
    public readonly isActive: boolean,
    public readonly mustChangePassword: boolean,
    public readonly dataNascimento: Date | null,
    public readonly sexo: string | null,
    public readonly telefone: string | null,
    public readonly enderecoCompleto: Address | null,
    public readonly dataAdmissao: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}