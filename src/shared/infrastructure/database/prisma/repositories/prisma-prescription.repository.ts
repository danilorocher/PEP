import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IPrescriptionRepository } from '../../../../domain/repositories/prescription.repository.interface';
import { Prescription } from '../../../../domain/entities/prescription.entity';
import { PrescriptionItem } from '../../../../domain/entities/prescription-item.entity';
import { MedicationAdministration } from '../../../../domain/entities/medication-administration.entity';

@Injectable()
export class PrismaPrescriptionRepository implements IPrescriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toPrescriptionDomain(record: any): Prescription {
    // 🔥 CORREÇÃO: Removido o `if (!record) return null;`
    return new Prescription(
      record.id, record.tenantId, record.medicalRecordId, record.hospitalizationId,
      record.prescritoPor, record.tipoPrescrito, record.dataHora, record.status,
      record.observacoes, record.assinadaDigitalmente, record.assinaturaHash,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  private toItemDomain(record: any): PrescriptionItem {
    // 🔥 CORREÇÃO: Removido o `if (!record) return null;`
    return new PrescriptionItem(
      record.id, record.prescriptionId, record.medicationId, record.dosagem,
      record.viaAdministracao, record.frequencia, record.horariosProgramados,
      record.duracaoDias, record.dataInicio, record.dataFim, record.observacoes,
      record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async createWithItemsAndAdministrations(
    prescription: Prescription, 
    items: PrescriptionItem[], 
    administrations: MedicationAdministration[]
  ): Promise<Prescription> {
    const created = await this.prisma.$transaction(async (tx) => {
      const p = await tx.prescription.create({
        data: {
          id: prescription.id,
          tenantId: prescription.tenantId,
          medicalRecordId: prescription.medicalRecordId,
          hospitalizationId: prescription.hospitalizationId,
          prescritoPor: prescription.prescritoPor,
          tipoPrescrito: prescription.tipoPrescrito as any,
          dataHora: prescription.dataHora,
          status: prescription.status as any,
          observacoes: prescription.observacoes,
          assinadaDigitalmente: prescription.assinadaDigitalmente,
          assinaturaHash: prescription.assinaturaHash
        }
      });

      for (const item of items) {
        await tx.prescriptionItem.create({
          data: {
            id: item.id,
            prescriptionId: p.id,
            medicationId: item.medicationId,
            dosagem: item.dosagem,
            viaAdministracao: item.viaAdministracao as any,
            frequencia: item.frequencia,
            horariosProgramados: item.horariosProgramados,
            duracaoDias: item.duracaoDias,
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            observacoes: item.observacoes,
            status: item.status as any
          }
        });
      }

      if (administrations.length > 0) {
        await tx.medicationAdministration.createMany({
          data: administrations.map(admin => ({
            id: admin.id,
            tenantId: admin.tenantId,
            prescriptionItemId: admin.prescriptionItemId,
            hospitalizationId: admin.hospitalizationId,
            administradoPor: admin.administradoPor,
            dataHoraProgamada: admin.dataHoraProgamada,
            dataHoraAdministrada: admin.dataHoraAdministrada,
            status: admin.status as any,
            observacoes: admin.observacoes
          }))
        });
      }

      return p;
    });

    return this.toPrescriptionDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<Prescription | null> {
    const record = await this.prisma.prescription.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { items: { where: { deletedAt: null } } }
    });
    // 🔥 CORREÇÃO: Trata o nulo aqui
    return record ? this.toPrescriptionDomain(record) : null;
  }

  async findByMedicalRecordId(medicalRecordId: string, tenantId: string, skip: number, take: number): Promise<{ data: Prescription[]; total: number }> {
    const [data, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where: { medicalRecordId, tenantId, deletedAt: null },
        skip,
        take,
        orderBy: { dataHora: 'desc' },
        include: { items: { where: { deletedAt: null } } }
      }),
      this.prisma.prescription.count({
        where: { medicalRecordId, tenantId, deletedAt: null }
      })
    ]);
    return { data: data.map(r => this.toPrescriptionDomain(r)), total };
  }

  async updateStatus(id: string, tenantId: string, status: string): Promise<void> {
    await this.prisma.prescription.update({
      where: { id, tenantId },
      data: { status: status as any }
    });
  }

  async findItemById(itemId: string): Promise<PrescriptionItem | null> {
    const record = await this.prisma.prescriptionItem.findUnique({
      where: { id: itemId }
    });
    // 🔥 CORREÇÃO: Trata o nulo aqui
    return record ? this.toItemDomain(record) : null;
  }

  async updateItemStatus(itemId: string, status: string): Promise<void> {
    await this.prisma.prescriptionItem.update({
      where: { id: itemId },
      data: { status: status as any }
    });
  }

  async cancelPendingAdministrationsByItem(itemId: string, tenantId: string, observacao: string): Promise<void> {
    await this.prisma.medicationAdministration.updateMany({
      where: { 
        prescriptionItemId: itemId, 
        tenantId, 
        status: { in: ['NAO_MINISTRADO', 'ATRASADO'] }
      },
      data: { 
        status: 'NAO_MINISTRADO', 
        observacoes: observacao 
      }
    });
  }

  async cancelPendingAdministrationsByPrescription(prescriptionId: string, tenantId: string, observacao: string): Promise<void> {
    const items = await this.prisma.prescriptionItem.findMany({
      where: { prescriptionId, deletedAt: null },
      select: { id: true }
    });

    const itemIds = items.map(i => i.id);

    if (itemIds.length > 0) {
      await this.prisma.medicationAdministration.updateMany({
        where: { 
          prescriptionItemId: { in: itemIds }, 
          tenantId, 
          status: { in: ['NAO_MINISTRADO', 'ATRASADO'] }
        },
        data: { 
          status: 'NAO_MINISTRADO', 
          observacoes: observacao 
        }
      });
    }
  }

  async addItemWithAdministrations(item: PrescriptionItem, administrations: MedicationAdministration[]): Promise<PrescriptionItem> {
    const created = await this.prisma.$transaction(async (tx) => {
      const i = await tx.prescriptionItem.create({
        data: {
          id: item.id,
          prescriptionId: item.prescriptionId,
          medicationId: item.medicationId,
          dosagem: item.dosagem,
          viaAdministracao: item.viaAdministracao as any,
          frequencia: item.frequencia,
          horariosProgramados: item.horariosProgramados,
          duracaoDias: item.duracaoDias,
          dataInicio: item.dataInicio,
          dataFim: item.dataFim,
          observacoes: item.observacoes,
          status: item.status as any
        }
      });

      if (administrations.length > 0) {
        await tx.medicationAdministration.createMany({
          data: administrations.map(admin => ({
            id: admin.id,
            tenantId: admin.tenantId,
            prescriptionItemId: admin.prescriptionItemId,
            hospitalizationId: admin.hospitalizationId,
            administradoPor: admin.administradoPor,
            dataHoraProgamada: admin.dataHoraProgamada,
            dataHoraAdministrada: admin.dataHoraAdministrada,
            status: admin.status as any,
            observacoes: admin.observacoes
          }))
        });
      }

      return i;
    });

    return this.toItemDomain(created);
  }
}