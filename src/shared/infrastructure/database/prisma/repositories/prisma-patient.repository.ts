import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IPatientRepository } from '../../../../domain/repositories/patient.repository.interface';
import { Patient, EmergencyContact } from '../../../../domain/entities/patient.entity';
import { Address } from '../../../../domain/entities/user.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPatientRepository implements IPatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(record: any): Patient | null {
    if (!record) return null;
    return new Patient(
      record.id, record.tenantId, record.nomeCompleto, record.cpf, record.cns,
      record.dataNascimento, record.sexo, record.nomeMae, record.nomePai,
      record.enderecoCompleto ? (record.enderecoCompleto as any as Address) : null, 
      record.telefone, 
      record.contatoEmergencia ? (record.contatoEmergencia as any as EmergencyContact) : null,
      record.convenioId, record.numeroCarteirinha, record.dataValidadeCarteirinha,
      record.alergias, record.comorbidades, record.historicoClinico,
      record.grupoSanguineo, record.status, record.createdAt, record.updatedAt, record.deletedAt
    );
  }

  async createWithMedicalRecord(patient: Patient, _ignoredMedicalRecordNumero: string, cpfHash: string, cnsHash?: string | null): Promise<Patient> {
    const created = await this.prisma.$transaction(async (tx) => {
      const p = await tx.patient.create({
        data: {
          id: patient.id, tenantId: patient.tenantId, nomeCompleto: patient.nomeCompleto,
          cpf: patient.cpf, cpfHash, cns: patient.cns, cnsHash, dataNascimento: patient.dataNascimento,
          sexo: patient.sexo as any, nomeMae: patient.nomeMae, nomePai: patient.nomePai,
          enderecoCompleto: patient.enderecoCompleto as any, telefone: patient.telefone,
          contatoEmergencia: patient.contatoEmergencia as any, convenioId: patient.convenioId,
          numeroCarteirinha: patient.numeroCarteirinha, dataValidadeCarteirinha: patient.dataValidadeCarteirinha,
          alergias: patient.alergias, comorbidades: patient.comorbidades, historicoClinico: patient.historicoClinico,
          grupoSanguineo: patient.grupoSanguineo as any, status: patient.status as any
        }
      });

      const count = await tx.medicalRecord.count({ where: { tenantId: p.tenantId } });
      const sequencial = count + 1;
      const numeroProntuario = `PEP-${String(sequencial).padStart(6, '0')}`;

      await tx.medicalRecord.create({
        data: { tenantId: p.tenantId, patientId: p.id, numero: numeroProntuario, status: 'ABERTO' }
      });

      return p;
    });

    return this.toDomain(created)!;
  }

  async findById(id: string, tenantId: string): Promise<Patient | null> {
    const record = await this.prisma.patient.findFirst({ where: { id, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findByCpf(cpfHash: string, tenantId: string): Promise<Patient | null> {
    const record = await this.prisma.patient.findFirst({ where: { cpfHash, tenantId, deletedAt: null } });
    return this.toDomain(record);
  }

  async findAll(tenantId: string, skip: number, take: number, filter?: any): Promise<{ data: Patient[]; total: number }> {
    const where: Prisma.PatientWhereInput = { tenantId, deletedAt: null };
    
    if (filter?.nomeCompleto) {
      where.nomeCompleto = { contains: filter.nomeCompleto, mode: 'insensitive' };
    }
    if (filter?.status) {
      where.status = filter.status as any;
    }
    if (filter?.convenioId) {
      where.convenioId = filter.convenioId;
    }

    const [data, total] = await Promise.all([
      this.prisma.patient.findMany({ 
        where, 
        skip, 
        take, 
        orderBy: { nomeCompleto: 'asc' },
        include: { medicalRecords: { select: { numero: true }, orderBy: { createdAt: 'desc' }, take: 1 } }
      }),
      this.prisma.patient.count({ where })
    ]);
    
    return { 
      data: data.map(r => Object.assign(this.toDomain(r)!, { 
        medicalRecords: r.medicalRecords,
        // 🔥 BUG 2 RESOLVIDO: O CPF é mascarado para a listagem pública, protegendo a criptografia!
        cpf: '***.***.***-**' 
      })), 
      total 
    };
  }

  async update(patient: Patient, cpfHash?: string, cnsHash?: string | null): Promise<void> {
    await this.prisma.patient.update({
      where: { id: patient.id },
      data: {
        nomeCompleto: patient.nomeCompleto, cpf: patient.cpf, cpfHash, cns: patient.cns, cnsHash,
        dataNascimento: patient.dataNascimento, sexo: patient.sexo as any,
        nomeMae: patient.nomeMae, nomePai: patient.nomePai, 
        enderecoCompleto: patient.enderecoCompleto as any,
        telefone: patient.telefone, 
        contatoEmergencia: patient.contatoEmergencia as any,
        convenioId: patient.convenioId, numeroCarteirinha: patient.numeroCarteirinha,
        dataValidadeCarteirinha: patient.dataValidadeCarteirinha, alergias: patient.alergias,
        comorbidades: patient.comorbidades, historicoClinico: patient.historicoClinico,
        grupoSanguineo: patient.grupoSanguineo as any, status: patient.status as any
      }
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.patient.update({
      where: { id, tenantId },
      data: { deletedAt: new Date(), status: 'INATIVO' }
    });
  }

  async hasActiveHospitalizations(id: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.hospitalization.count({
      where: { patientId: id, tenantId, status: 'ATIVA', deletedAt: null }
    });
    return count > 0;
  }

  async getActiveMedicalRecord(patientId: string, tenantId: string): Promise<any> {
    return this.prisma.medicalRecord.findFirst({
      where: { patientId, tenantId, status: 'ABERTO', deletedAt: null },
      include: { evolutions: true, prescriptions: true }
    });
  }

  async getHospitalizations(patientId: string, tenantId: string): Promise<any[]> {
    return this.prisma.hospitalization.findMany({
      where: { patientId, tenantId, deletedAt: null },
      orderBy: { dataEntrada: 'desc' }
    });
  }

  async getCompletePatientData(id: string, tenantId: string): Promise<any> {
    return this.prisma.patient.findFirst({
      where: { id, tenantId },
      include: {
        medicalRecords: {
          include: {
            evolutions: true,
            prescriptions: { include: { items: true } },
            examRequests: true
          }
        },
        hospitalizations: true,
        appointments: true,
        billingGuides: { include: { items: true } }
      }
    });
  }

  async anonymize(id: string, tenantId: string, data: Partial<Patient>): Promise<void> {
    await this.prisma.patient.update({
      where: { id, tenantId },
      data: {
        nomeCompleto: data.nomeCompleto,
        cpf: data.cpf!,
        cpfHash: null,
        cns: null,
        cnsHash: null,
        telefone: null,
        enderecoCompleto: Prisma.JsonNull,
        contatoEmergencia: Prisma.JsonNull,
        nomeMae: null,
        nomePai: null,
        numeroCarteirinha: null,
        status: 'INATIVO'
      }
    });
  }
}