import { AuditLog } from '@prisma/client';

export interface IAuditRepository {
  findByPatientId(
    tenantId: string, 
    patientId: string, 
    skip: number, 
    take: number
  ): Promise<{ data: AuditLog[]; total: number }>;
}

export const AUDIT_REPOSITORY_TOKEN = Symbol('IAuditRepository');