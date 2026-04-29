import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { CreateVitalSignDto } from '../../../../modules/assistance/dto/assistance.dto';

@Injectable()
export class VitalSignsUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, data: CreateVitalSignDto) {
    return await this.prisma.vitalSign.create({
      data: {
        tenantId,
        registeredById: userId,
        patientId: data.patientId,
        hospitalizationId: data.hospitalizationId,
        systolicPressure: data.systolicPressure,
        diastolicPressure: data.diastolicPressure,
        temperature: data.temperature,
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        spo2: data.spo2,
        painScale: data.painScale,
        observacoes: data.observacoes,
      }
    });
  }

  async findByPatient(tenantId: string, patientId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.vitalSign.findMany({
        where: { tenantId, patientId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { dataHora: 'desc' },
        include: { registeredBy: { select: { nomeCompleto: true, roleName: true } } }
      }),
      this.prisma.vitalSign.count({ where: { tenantId, patientId, deletedAt: null } })
    ]);
    return { data, total, page, limit };
  }
}