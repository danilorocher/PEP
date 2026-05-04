import { Inject, Injectable } from '@nestjs/common';
import { IAuditRepository, AUDIT_REPOSITORY_TOKEN } from '../../../domain/repositories/audit.repository.interface';
import { QueryAuditDto } from '../../../../modules/audit/dto/query-audit.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class AuditUseCases {
  constructor(
    @Inject(AUDIT_REPOSITORY_TOKEN)
    private readonly auditRepo: IAuditRepository,
  ) {}

  async getMedicalRecordAudit(tenantId: string, patientId: string, query: QueryAuditDto) {
    const { page, limit } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    
    const { data, total } = await this.auditRepo.findByPatientId(tenantId, patientId, skip, take);
    return buildPaginatedResult(data, total, page, limit);
  }
}