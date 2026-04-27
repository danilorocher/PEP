import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class RetentionService {
  private readonly MINIMUM_RETENTION_YEARS = 20;

  /**
   * Valida se um prontuário ou dado clínico pode ser permanentemente excluído.
   * Conforme Resolução CFM 1821/2007 e LGPD, dados de saúde possuem retenção obrigatória.
   */
  validatePermanentDeletion(createdAt: Date): void {
    const now = new Date();
    const retentionLimit = new Date(createdAt);
    retentionLimit.setFullYear(retentionLimit.getFullYear() + this.MINIMUM_RETENTION_YEARS);

    if (now < retentionLimit) {
      throw new ForbiddenException(
        `Eliminação permanente bloqueada. Prazo legal de retenção (20 anos) não atingido. Disponível apenas para Soft Delete.`,
      );
    }
  }

  /**
   * Regra de negócio: Prontuários no sistema PEP+ nunca devem ser excluídos via Hard Delete
   * por usuários ou processos automatizados antes do prazo de 20 anos.
   */
  enforceSoftDeleteOnly(): void {
    // Esta função serve como marcador de política para os repositórios
    return;
  }
}