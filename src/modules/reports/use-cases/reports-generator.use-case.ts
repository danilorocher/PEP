import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/database/prisma/repositories/prisma.service';
import { ReportType } from '../enums/report-type.enum';

@Injectable()
export class ReportsGeneratorUseCase {
  private readonly logger = new Logger(ReportsGeneratorUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(tenantId: string, options: { type: ReportType; startDate?: Date; endDate?: Date; params?: any }) {
    this.logger.log(`Gerando dados para: ${options.type} - Tenant: ${tenantId}`);
    
    const { type, startDate, endDate, params } = options;

    switch (type) {
      case ReportType.PACIENTES_INTERNADOS:
        return this.getPacientesInternados(tenantId);

      case ReportType.TAXA_OCUPACAO_LEITOS:
        return this.getTaxaOcupacao(tenantId);

      case ReportType.PACIENTES_POR_ALA:
        return this.getPacientesPorAla(tenantId);

      case ReportType.HISTORICO_MEDICAMENTOS:
        return this.getHistoricoMedicamentos(tenantId, startDate, endDate, params?.patientId);

      case ReportType.ADMINISTRACAO_MEDICAMENTO_HORARIO:
        return this.getEstatisticaAdministracao(tenantId, startDate, endDate);

      case ReportType.EXAMES_REALIZADOS:
        return this.getExamesRealizados(tenantId, startDate, endDate);

      case ReportType.TEMPO_MEDIO_INTERNACAO:
        return this.getTempoMedioInternacao(tenantId, startDate, endDate);

      case ReportType.AGENDA_DO_DIA:
        return this.getAgendaDia(tenantId, params?.date);

      case ReportType.FATURAMENTO_POR_CONVENIO:
        return this.getFaturamentoConvenio(tenantId, startDate, endDate);

      default:
        return { message: "Tipo de relatório não suportado", timestamp: new Date() };
    }
  }

  private async getPacientesInternados(tenantId: string) {
    return this.prisma.hospitalization.findMany({
      where: { tenantId, status: 'ATIVA', deletedAt: null },
      include: {
        patient: { select: { nomeCompleto: true, cpf: true } },
        bed: { select: { numero: true } },
        ward: { select: { nome: true } },
        medicoResponsavel: { select: { nomeCompleto: true } }
      }
    });
  }

  private async getTaxaOcupacao(tenantId: string) {
    const wards = await this.prisma.ward.findMany({
      where: { tenantId, deletedAt: null, status: 'ATIVO' },
      include: {
        _count: { select: { beds: { where: { deletedAt: null } } } },
        beds: { where: { status: 'OCUPADO', deletedAt: null } }
      }
    });

    return wards.map(w => {
      const totalBeds = w._count.beds;
      const occupiedBeds = w.beds.length;
      const tax = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
      return {
        ala: w.nome,
        totalLeitos: totalBeds,
        ocupados: occupiedBeds,
        taxa: `${tax.toFixed(2)}%`
      };
    });
  }

  private async getPacientesPorAla(tenantId: string) {
    return this.prisma.ward.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        nome: true,
        _count: {
          select: { hospitalizations: { where: { status: 'ATIVA' } } }
        }
      }
    });
  }

  private async getHistoricoMedicamentos(tenantId: string, start?: Date, end?: Date, patientId?: string) {
    return this.prisma.medicationAdministration.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(patientId && { prescriptionItem: { prescription: { medicalRecord: { patientId } } } }),
        ...(start && end && { dataHoraAdministrada: { gte: start, lte: end } })
      },
      include: {
        prescriptionItem: {
          include: {
            medication: { select: { nome: true } },
            prescription: { include: { medicalRecord: { include: { patient: { select: { nomeCompleto: true } } } } } }
          }
        },
        administrador: { select: { nomeCompleto: true } }
      }
    });
  }

  private async getEstatisticaAdministracao(tenantId: string, start?: Date, end?: Date) {
    const stats = await this.prisma.medicationAdministration.groupBy({
      by: ['status'],
      where: {
        tenantId,
        deletedAt: null,
        ...(start && end && { dataHoraProgamada: { gte: start, lte: end } })
      },
      _count: true
    });

    const total = stats.reduce((acc, curr) => acc + curr._count, 0);
    return stats.map(s => ({
      status: s.status,
      quantidade: s._count,
      percentual: total > 0 ? `${((s._count / total) * 100).toFixed(2)}%` : '0%'
    }));
  }

  private async getExamesRealizados(tenantId: string, start?: Date, end?: Date) {
    return this.prisma.examRequest.findMany({
      where: {
        tenantId,
        status: 'CONCLUIDO',
        deletedAt: null,
        ...(start && end && { dataHoraResultado: { gte: start, lte: end } })
      },
      include: {
        exam: { select: { nome: true, tipo: true } },
        patient: { select: { nomeCompleto: true } },
        doctor: { select: { nomeCompleto: true } }
      }
    });
  }

  private async getTempoMedioInternacao(tenantId: string, start?: Date, end?: Date) {
    const hospitalizations = await this.prisma.hospitalization.findMany({
      where: {
        tenantId,
        status: 'ALTA',
        deletedAt: null,
        dataAlta: { not: null },
        ...(start && end && { dataEntrada: { gte: start, lte: end } })
      },
      select: { dataEntrada: true, dataAlta: true }
    });

    if (hospitalizations.length === 0) return { mediaDias: 0 };

    const totalDiff = hospitalizations.reduce((acc, h) => {
      return acc + (h.dataAlta!.getTime() - h.dataEntrada.getTime());
    }, 0);

    const mediaMs = totalDiff / hospitalizations.length;
    return { mediaDias: (mediaMs / (1000 * 60 * 60 * 24)).toFixed(2) };
  }

  private async getAgendaDia(tenantId: string, dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    return this.prisma.appointment.findMany({
      where: {
        tenantId,
        deletedAt: null,
        dataHora: { gte: targetDate, lt: nextDay }
      },
      include: {
        patient: { select: { nomeCompleto: true } },
        doctor: { select: { nomeCompleto: true } },
        specialty: { select: { nome: true } }
      },
      orderBy: { dataHora: 'asc' }
    });
  }

  private async getFaturamentoConvenio(tenantId: string, start?: Date, end?: Date) {
    return this.prisma.billingGuide.groupBy({
      by: ['convenioId'],
      where: {
        tenantId,
        deletedAt: null,
        status: { in: ['AUTORIZADA', 'PAGA'] },
        ...(start && end && { dataEmissao: { gte: start, lte: end } })
      },
      _sum: { valorTotal: true },
      _count: { id: true }
    });
  }
}