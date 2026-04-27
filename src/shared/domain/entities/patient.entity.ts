import { Address } from './user.entity';

export interface EmergencyContact {
  nome: string;
  telefone: string;
  parentesco: string;
}

export class Patient {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly nomeCompleto: string,
    public readonly cpf: string, // Armazenado Criptografado
    public readonly cns: string | null, // Armazenado Criptografado
    public readonly dataNascimento: Date,
    public readonly sexo: string,
    public readonly nomeMae: string | null,
    public readonly nomePai: string | null,
    public readonly enderecoCompleto: Address | null,
    public readonly telefone: string | null,
    public readonly contatoEmergencia: EmergencyContact | null,
    public readonly convenioId: string | null,
    public readonly numeroCarteirinha: string | null,
    public readonly dataValidadeCarteirinha: Date | null,
    public readonly alergias: string[],
    public readonly comorbidades: string[],
    public readonly historicoClinico: string | null,
    public readonly grupoSanguineo: string | null,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}