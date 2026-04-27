import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IAppointmentRepository } from '../../../../domain/repositories/appointment.repository.interface';
import { Appointment } from '../../../../domain/entities/appointment.entity';

@Injectable()
export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Appointment {
    if (!record) return null;
    return new Appointment(
      record.id, record.tenantId, record.patientId, record.doctorId, record.specialtyId,
      record.dataHora, record.duracao, record.tipo, record.status, record.motivoCancelamento,
      record.convenioId, record.numeroGuiaConsulta, record.cid10Id, record.observacoes,
      record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const created = await this.prisma.appointment.create({
      data: {
        id: appointment.id, tenantId: appointment.tenantId, patientId: appointment.patientId,
        doctorId: appointment.doctorId, specialtyId: appointment.specialtyId,
        dataHora: appointment.dataHora, duracao: appointment.duracao, tipo: appointment.tipo as any,
        status: appointment.status as any, motivoCancelamento: appointment.motivoCancelamento,
        convenioId: appointment.convenioId, numeroGuiaConsulta: appointment.numeroGuiaConsulta,
        cid10Id: appointment.cid10Id, observacoes: appointment.observacoes
      }
    });
    return this.toDomain(created);
  }

  async findById(id: string, tenantId: string): Promise<Appointment | null> {
    const record = await this.prisma.appointment.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, filters?: any): Promise<Appointment[]> {
    const where: any = { tenantId, deletedAt: null };
    
    if (filters?.doctorId) where.doctorId = filters.doctorId;
    if (filters?.patientId) where.patientId = filters.patientId;
    if (filters?.status) where.status = filters.status;
    if (filters?.dataInicial && filters?.dataFinal) {
      where.dataHora = { gte: filters.dataInicial, lte: filters.dataFinal };
    }

    const records = await this.prisma.appointment.findMany({
      where,
      orderBy: { dataHora: 'asc' }
    });
    return records.map(this.toDomain);
  }

  async update(appointment: Appointment): Promise<void> {
    await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        dataHora: appointment.dataHora, duracao: appointment.duracao, tipo: appointment.tipo as any,
        status: appointment.status as any, motivoCancelamento: appointment.motivoCancelamento,
        cid10Id: appointment.cid10Id, observacoes: appointment.observacoes
      }
    });
  }

  async hasConflict(doctorId: string, tenantId: string, dataHora: Date, duracaoMinutos: number, excludeAppointmentId?: string): Promise<boolean> {
    const dataFimNova = new Date(dataHora.getTime() + duracaoMinutos * 60000);

    const whereClause: any = {
      doctorId,
      tenantId,
      deletedAt: null,
      status: { in: ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO'] }
    };

    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const agendamentos = await this.prisma.appointment.findMany({ where: whereClause });

    // Algoritmo de verificação de sobreposição de horários
    for (const agendamento of agendamentos) {
      const dataInicioExistente = agendamento.dataHora;
      const dataFimExistente = new Date(dataInicioExistente.getTime() + agendamento.duracao * 60000);

      if (dataHora < dataFimExistente && dataFimNova > dataInicioExistente) {
        return true; // Existe conflito (Overlapping)
      }
    }
    return false;
  }

  // Transação: Confirma agendamento e gera Guia de Faturamento se tiver convênio
  async confirmAndGenerateBilling(appointmentId: string, tenantId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId, tenantId, deletedAt: null }
      });

      if (!appointment) throw new NotFoundException('Agendamento não encontrado.');

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CONFIRMADO' }
      });

      // Se possui convênio e ainda não gerou guia, gera a guia TISS em Rascunho
      if (appointment.convenioId) {
        const guiaExiste = await tx.billingGuide.findFirst({
          where: { appointmentId, tenantId, deletedAt: null }
        });

        if (!guiaExiste) {
          await tx.billingGuide.create({
            data: {
              tenantId,
              patientId: appointment.patientId,
              convenioId: appointment.convenioId,
              appointmentId: appointment.id,
              tipo: 'CONSULTA',
              status: 'RASCUNHO',
              observacoes: 'Guia gerada automaticamente na confirmação da consulta.'
            }
          });
        }
      }
    });
  }
}