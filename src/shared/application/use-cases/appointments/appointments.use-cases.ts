import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IAppointmentRepository, APPOINTMENT_REPOSITORY_TOKEN } from '../../../domain/repositories/appointment.repository.interface';
import { Appointment } from '../../../domain/entities/appointment.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import { CreateAppointmentDto, CancelAppointmentDto, FinishAppointmentDto } from '../../../../modules/appointments/dto/appointment.dto';

import { QueryAppointmentsDto } from '../../../../modules/appointments/dto/query-appointments.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class AppointmentsUseCases {
  constructor(
    @Inject(APPOINTMENT_REPOSITORY_TOKEN) private readonly apptRepo: IAppointmentRepository,
    @InjectQueue('notifications') private readonly notificationQueue: Queue, // Fila do BullMQ
  ) {}

  async create(tenantId: string, data: CreateAppointmentDto): Promise<Appointment> {
    const dataHoraAgendada = new Date(data.dataHora);
    
    // Verificação de Conflito de Agenda (Regra de Negócio Crítica)
    const hasConflict = await this.apptRepo.hasConflict(data.doctorId, tenantId, dataHoraAgendada, data.duracao);
    if (hasConflict) {
      throw new BadRequestException('O médico selecionado já possui um agendamento ou bloqueio neste horário.');
    }

    const newAppt = new Appointment(
      crypto.randomUUID(), tenantId, data.patientId, data.doctorId, data.specialtyId,
      dataHoraAgendada, data.duracao, data.tipo, 'AGENDADO', null,
      data.convenioId || null, null, null, data.observacoes || null,
      new Date(), new Date(), null
    );

    const savedAppt = await this.apptRepo.create(newAppt);

    // Adiciona Job na Fila para notificar o paciente 24h antes
    const delay = dataHoraAgendada.getTime() - Date.now() - (24 * 60 * 60 * 1000); // 24 horas antes
    if (delay > 0) {
      await this.notificationQueue.add('appointment_reminder', {
        appointmentId: savedAppt.id,
        patientId: savedAppt.patientId,
        tenantId
      }, { delay });
    }

    return savedAppt;
  }

  async findAll(tenantId: string, query: QueryAppointmentsDto) {
    const { page, limit, doctorId, patientId, status, dataInicial, dataFinal } = query;
    const { skip, take } = buildPaginationQuery(page, limit);
    const filters = { doctorId, patientId, status, dataInicial, dataFinal };
    
    const { data, total } = await this.apptRepo.findAll(tenantId, skip, take, filters);
    return buildPaginatedResult(data, total, page, limit);
  }

  async findToday(tenantId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Bypass da paginação para buscar o dia inteiro sem perder performance (limite 1000)
    const { data, total } = await this.apptRepo.findAll(tenantId, 0, 1000, { dataInicial: hoje.toISOString(), dataFinal: amanha.toISOString() });
    return buildPaginatedResult(data, total, 1, 1000);
  }

  async checkAvailability(doctorId: string, tenantId: string, dataHora: string, duracao: number) {
    const hasConflict = await this.apptRepo.hasConflict(doctorId, tenantId, new Date(dataHora), duracao);
    return { available: !hasConflict };
  }

  async confirm(id: string, tenantId: string): Promise<void> {
    await this.apptRepo.confirmAndGenerateBilling(id, tenantId);
  }

  async cancel(id: string, tenantId: string, data: CancelAppointmentDto): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');
    if (['REALIZADO', 'CANCELADO'].includes(appt.status)) throw new BadRequestException('Não é possível cancelar este agendamento.');

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, appt.doctorId, appt.specialtyId,
      appt.dataHora, appt.duracao, appt.tipo, 'CANCELADO', data.motivoCancelamento,
      appt.convenioId, appt.numeroGuiaConsulta, appt.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );

    await this.apptRepo.update(updatedAppt);

    // Dispara notificação de cancelamento imediata
    await this.notificationQueue.add('appointment_cancelled', {
      appointmentId: appt.id, patientId: appt.patientId, tenantId, motivo: data.motivoCancelamento
    });
  }

  async start(id: string, tenantId: string): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, appt.doctorId, appt.specialtyId,
      appt.dataHora, appt.duracao, appt.tipo, 'EM_ATENDIMENTO', appt.motivoCancelamento,
      appt.convenioId, appt.numeroGuiaConsulta, appt.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );
    await this.apptRepo.update(updatedAppt);
  }

  async finish(id: string, tenantId: string, data: FinishAppointmentDto): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, appt.doctorId, appt.specialtyId,
      appt.dataHora, appt.duracao, appt.tipo, 'REALIZADO', appt.motivoCancelamento,
      appt.convenioId, appt.numeroGuiaConsulta, data.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );
    await this.apptRepo.update(updatedAppt);
  }
}