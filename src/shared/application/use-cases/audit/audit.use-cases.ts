import { Inject, Injectable } from '@nestjs/common';
import { IAuditRepository, AUDIT_REPOSITORY_TOKEN } from '../../../domain/repositories/audit.repository.interface';

@Injectable()
export class AuditUseCases {
  constructor(
    @Inject(AUDIT_REPOSITORY_TOKEN)
    private readonly auditRepo: IAuditRepository,
  ) {}

  async getMedicalRecordAudit(tenantId: string, patientId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const result = await this.auditRepo.findByPatientId(tenantId, patientId, skip, limit);

    return {
      data: result.data,
      total: result.total,
      page,
      limit,
    };
  }
}