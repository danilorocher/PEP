// NENHUMA importação do Prisma ou NestJS aqui!
export class User {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  // Regras de negócio puras podem vir aqui, ex:
  deactivate() {
    // Lógica para desativar usuário
  }
}