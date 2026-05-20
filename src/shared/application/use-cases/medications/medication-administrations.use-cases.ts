import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPrescriptionRepository, PRESCRIPTION_REPOSITORY_TOKEN } from '../../../domain/repositories/prescription.repository.interface';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { AdministerMedicationDto } from '../../../../modules/medications/dto/medication-administration.dto';
import { AccountConsumptionService } from '../hospital-billing/account-consumption.service';

@Injectable()
export class MedicationAdministrationsUseCases {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY_TOKEN) private readonly prescriptionRepo: IPrescriptionRepository,
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly medicalRecordRepo: IMedicalRecordRepository,
    private readonly prisma: PrismaService,
    private readonly consumptionService: AccountConsumptionService
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
            include: { 
              prescription: { select: { medicalRecordId: true } },
              medication: { select: { nome: true } }
            }
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
          include: { 
            prescription: { select: { medicalRecordId: true, hospitalizationId: true } },
            medication: { select: { id: true, nome: true, controleEspecial: true } } 
          }
        }
      }
    });

    if (!admin) throw new NotFoundException('Administração de medicamento não encontrada.');
    if (admin.status === 'MINISTRADO' || admin.status === 'RECUSADO_PACIENTE') {
      throw new BadRequestException(`A medicação já está com status ${admin.status}.`);
    }

    const record = await this.medicalRecordRepo.findById(admin.prescriptionItem.prescription.medicalRecordId, tenantId);
    const medicationId = admin.prescriptionItem.medication.id;

    // 🔥 TRANSAÇÃO ACID: ENFERMAGEM + FARMÁCIA + FATURAMENTO
    await this.prisma.$transaction(async (tx) => {
      
      // 1. Atualiza a Checagem da Enfermagem
      await tx.medicationAdministration.update({
        where: { id: administrationId },
        data: {
          status: data.status as any,
          administradoPor: userId,
          dataHoraAdministrada: new Date(),
          observacoes: data.observacoes || admin.observacoes
        }
      });

      if (data.status === 'MINISTRADO') {
        
        // 2. 🔥 LÓGICA DE FARMÁCIA: Baixa de Estoque Automática (FEFO)
        const availableStock = await tx.medicationStock.findFirst({
          where: {
            medicationId: medicationId,
            tenantId: tenantId,
            quantidade: { gte: 1 }, 
            deletedAt: null,
            validade: { gte: new Date() } // Impede baixa de lote vencido
          },
          orderBy: { validade: 'asc' }
        });

        if (availableStock) {
          // Desconta 1 unidade do estoque
          await tx.medicationStock.update({
            where: { id: availableStock.id },
            data: { quantidade: { decrement: 1 } }
          });

          // Registra na tabela oficial do sistema para Log de Movimentos de Enfermagem/Farmácia
          await tx.medicationKardex.create({
            data: {
              tenantId: tenantId,
              patientId: record!.patientId,
              medicalRecordId: record!.id,
              medicationId: medicationId,
              responsavelId: userId,
              acao: 'ADMINISTRADO',
              detalhes: `Administrado via Prontuário. Baixa de 1 un. no Lote ${availableStock.lote}.`
            }
          });

          // Se for controlado/psicotrópico, regista no livro da ANVISA também
          if (admin.prescriptionItem.medication.controleEspecial) {
             await tx.controlledMedicationLog.create({
               data: {
                 tenantId,
                 medicationId,
                 stockId: availableStock.id,
                 pacienteId: record!.patientId,
                 responsavelId: userId,
                 tipoOperacao: 'SAIDA',
                 quantidade: 1,
                 justificativa: `Administração à beira-leito (Prescrição Item: ${admin.prescriptionItemId})`
               }
             });
          }
        }

        // 3. 🔥 LÓGICA DE FATURAMENTO: Lança o item na Conta TISS do Paciente
        const valorUnitarioSimulado = 45.90; 
        await this.consumptionService.recordConsumption(tenantId, {
          patientId: record!.patientId,
          hospitalizationId: admin.prescriptionItem.prescription.hospitalizationId ?? undefined,
          tipo: 'MEDICATION',
          description: `Admin. de Medicamento: ${admin.prescriptionItem.medication.nome} (${admin.prescriptionItem.dosagem})`,
          quantity: 1,
          unitPrice: valorUnitarioSimulado,
          sourceModule: 'PHARMACY',
          referenceId: admin.prescriptionItemId
        });
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