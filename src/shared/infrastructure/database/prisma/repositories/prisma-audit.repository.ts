import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IAuditRepository } from '../../../../domain/repositories/audit.repository.interface';
import { AuditLog } from '@prisma/client';

@Injectable()
export class PrismaAuditRepository implements IAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPatientId(
    tenantId: string, 
    patientId: string, 
    skip: number, 
    take: number
  ): Promise<{ data: AuditLog[]; total: number }> {
    const where = {
      tenantId,
      entidade: 'medical-record',
      entidadeId: patientId,
    };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              nomeCompleto: true,
              email: true,
              roleName: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }
}