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
    const delay = dataHoraAgendada.getTime() - Date.now() - (24 * 60 * 60 * 1000); 
    if (delay > 0) {
      await this.notificationQueue.add('appointment_reminder', {
        appointmentId: savedAppt.id,
        patientId: savedAppt.patientId,
        tenantId
      }, { delay });
    }

    return savedAppt;
  }

  async reschedule(id: string, tenantId: string, dataHora: string, doctorId: string): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');

    const novaDataHora = new Date(dataHora);
    const startOfDay = new Date(novaDataHora);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { data: agendamentosDoDia } = await this.apptRepo.findAll(tenantId, 0, 1000, { 
      doctorId, 
      dataInicial: startOfDay.toISOString(), 
      dataFinal: endOfDay.toISOString() 
    });

    const novoFim = new Date(novaDataHora.getTime() + appt.duracao * 60000);

    const hasConflict = agendamentosDoDia.some((a: any) => {
      if (a.id === id) return false; 
      if (a.status === 'CANCELADO') return false;
      const aInicio = new Date(a.dataHora);
      const aFim = new Date(aInicio.getTime() + a.duracao * 60000);
      return (novaDataHora < aFim && novoFim > aInicio);
    });

    if (hasConflict) {
      throw new BadRequestException('O médico já possui outro paciente neste horário exato.');
    }

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, doctorId, appt.specialtyId,
      novaDataHora, appt.duracao, appt.tipo, appt.status, appt.motivoCancelamento,
      appt.convenioId, appt.numeroGuiaConsulta, appt.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );

    await this.apptRepo.update(updatedAppt);
  }

  async findOne(id: string, tenantId: string): Promise<Appointment> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');
    return appt;
  }

  // 🔥 NOVO MÉTODO: Caso de uso para deletar agendamento
  async delete(id: string, tenantId: string): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');
    
    // Regra Extra: Não permitir excluir agendamentos já realizados
    if (appt.status === 'REALIZADO') {
      throw new BadRequestException('Não é permitido excluir um agendamento que já foi realizado.');
    }

    await this.apptRepo.delete(id);
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

  async arrive(id: string, tenantId: string): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, appt.doctorId, appt.specialtyId,
      appt.dataHora, appt.duracao, appt.tipo, 'CONFIRMADO', 
      appt.motivoCancelamento, appt.convenioId, appt.numeroGuiaConsulta, appt.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );
    await this.apptRepo.update(updatedAppt);
  }

  async miss(id: string, tenantId: string): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, appt.doctorId, appt.specialtyId,
      appt.dataHora, appt.duracao, appt.tipo, 'FALTOU', 
      appt.motivoCancelamento, appt.convenioId, appt.numeroGuiaConsulta, appt.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );
    await this.apptRepo.update(updatedAppt);
  }

  async digitalCheckin(id: string, tenantId: string): Promise<void> {
    const appt = await this.apptRepo.findById(id, tenantId);
    if (!appt) throw new NotFoundException('Agendamento não encontrado.');

    const updatedAppt = new Appointment(
      appt.id, appt.tenantId, appt.patientId, appt.doctorId, appt.specialtyId,
      appt.dataHora, appt.duracao, appt.tipo, 'AGUARDANDO_ATENDIMENTO', 
      appt.motivoCancelamento, appt.convenioId, appt.numeroGuiaConsulta, appt.cid10Id, appt.observacoes,
      appt.createdAt, new Date(), appt.deletedAt
    );
    await this.apptRepo.update(updatedAppt);

    await this.notificationQueue.add('patient_arrived', {
      appointmentId: appt.id, doctorId: appt.doctorId, tenantId
    });
  }

  async getAvailability(doctorId: string, tenantId: string, date: string) {
    const dataBusca = new Date(date);
    dataBusca.setHours(0, 0, 0, 0);
    const diaSeguinte = new Date(dataBusca);
    diaSeguinte.setDate(diaSeguinte.getDate() + 1);

    const { data: agendamentos } = await this.apptRepo.findAll(tenantId, 0, 1000, {
      doctorId,
      dataInicial: dataBusca.toISOString(),
      dataFinal: diaSeguinte.toISOString()
    });

    return agendamentos.map((a: any) => ({
      inicio: a.dataHora,
      fim: new Date(new Date(a.dataHora).getTime() + a.duracao * 60000)
    }));
  }
}