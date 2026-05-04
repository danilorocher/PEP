import { Appointment } from '../entities/appointment.entity';

export interface IAppointmentRepository {
  create(appointment: Appointment): Promise<Appointment>;
  findById(id: string, tenantId: string): Promise<Appointment | null>;
  
  // 🔥 Assinatura atualizada para paginação:
  findAll(tenantId: string, skip: number, take: number, filters?: any): Promise<{ data: Appointment[]; total: number }>;
  
  update(appointment: Appointment): Promise<void>;
  
  // Regras de negócio complexas mapeadas para o banco
  hasConflict(doctorId: string, tenantId: string, dataHora: Date, duracaoMinutos: number, excludeAppointmentId?: string): Promise<boolean>;
  confirmAndGenerateBilling(appointmentId: string, tenantId: string): Promise<void>;
}

export const APPOINTMENT_REPOSITORY_TOKEN = Symbol('IAppointmentRepository');