import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPrescriptionRepository, PRESCRIPTION_REPOSITORY_TOKEN } from '../../../domain/repositories/prescription.repository.interface';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { AdministerMedicationDto } from '../../../../modules/medications/dto/medication-administration.dto';

@Injectable()
export class MedicationAdministrationsUseCases {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY_TOKEN) private readonly prescriptionRepo: IPrescriptionRepository,
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly medicalRecordRepo: IMedicalRecordRepository,
    private readonly prisma: PrismaService
  ) {}

  async getPendingAdministrations(tenantId: string, page: number, limit: number, userId: string, ip: string, userAgent: string) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.medicationAdministration.findMany({
        where: { tenantId, status: { in: ['NAO_MINISTRADO', 'ATRASADO'] }, deletedAt: null },
        skip,
        take: limit,
        orderBy: { dataHoraProgamada: 'asc' },
        include: {
          prescriptionItem: {
            include: { prescription: { select: { medicalRecordId: true } } }
          }
        }
      }),
      this.prisma.medicationAdministration.count({
        where: { tenantId, status: { in: ['NAO_MINISTRADO', 'ATRASADO'] }, deletedAt: null }
      })
    ]);

    await this.prisma.auditLog.create({
      data: {
        tenantId, userId, acao: 'LISTAR_MEDICACOES_PENDENTES',
        entidade: 'medication-administration', entidadeId: 'all', ip, userAgent
      }
    });

    return { data, total, page, limit };
  }

  async administerMedication(tenantId: string, administrationId: string, userId: string, data: AdministerMedicationDto, ip: string, userAgent: string) {
    const admin = await this.prisma.medicationAdministration.findFirst({
      where: { id: administrationId, tenantId, deletedAt: null },
      include: {
        prescriptionItem: {
          include: { prescription: { select: { medicalRecordId: true, hospitalizationId: true } } }
        }
      }
    });

    if (!admin) throw new NotFoundException('Administração de medicamento não encontrada.');
    if (admin.status === 'MINISTRADO' || admin.status === 'RECUSADO_PACIENTE') {
      throw new BadRequestException(`A medicação já está com status ${admin.status}.`);
    }

    const record = await this.medicalRecordRepo.findById(admin.prescriptionItem.prescription.medicalRecordId, tenantId);

    await this.prisma.medicationAdministration.update({
      where: { id: administrationId },
      data: {
        status: data.status as any,
        administradoPor: userId,
        dataHoraAdministrada: new Date(),
        observacoes: data.observacoes || admin.observacoes
      }
    });

    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, `ADMINISTRAR_MEDICACAO_${data.status}`, ip, userAgent);
  }

  async getAdministrationHistory(tenantId: string, prescriptionItemId: string, page: number, limit: number, userId: string, ip: string, userAgent: string) {
    const item = await this.prescriptionRepo.findItemById(prescriptionItemId);
    if (!item) throw new NotFoundException('Item de prescrição não encontrado.');

    const prescription = await this.prescriptionRepo.findById(item.prescriptionId, tenantId);
    const record = await this.medicalRecordRepo.findById(prescription!.medicalRecordId, tenantId);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.medicationAdministration.findMany({
        where: { prescriptionItemId, tenantId, deletedAt: null },
        skip,
        take: limit,
        orderBy: { dataHoraProgamada: 'asc' }
      }),
      this.prisma.medicationAdministration.count({
        where: { prescriptionItemId, tenantId, deletedAt: null }
      })
    ]);

    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, 'LISTAR_HISTORICO_MEDICACAO', ip, userAgent);

    return { data, total, page, limit };
  }
}