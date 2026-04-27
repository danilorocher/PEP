import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPatientRepository, PATIENT_REPOSITORY_TOKEN } from '../../../domain/repositories/patient.repository.interface';
import { Patient } from '../../../domain/entities/patient.entity';
import { EncryptionService } from '../../../infrastructure/database/prisma/repositories/services/encryption.service';
import { isValidCPF, isValidCNS } from '../../../utils/validators';
import * as crypto from 'crypto';
import { CreatePatientDto, UpdatePatientDto } from '../../../../modules/patients/dto/patient.dto';

@Injectable()
export class PatientsUseCases {
  constructor(
    @Inject(PATIENT_REPOSITORY_TOKEN) private readonly patientRepo: IPatientRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async create(tenantId: string, data: CreatePatientDto): Promise<Patient> {
    if (!isValidCPF(data.cpf)) throw new BadRequestException('CPF inválido.');
    if (data.cns && !isValidCNS(data.cns)) throw new BadRequestException('CNS do DATASUS inválido.');

    const cpfHash = this.encryption.hash(data.cpf);
    const encryptedCpf = this.encryption.encrypt(data.cpf);
    
    if (await this.patientRepo.findByCpf(cpfHash, tenantId)) {
      throw new BadRequestException('Já existe um paciente cadastrado com este CPF nesta clínica.');
    }

    const encryptedCns = data.cns ? this.encryption.encrypt(data.cns) : null;
    const cnsHash = data.cns ? this.encryption.hash(data.cns) : null;
    const medicalRecordNumero = `PEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newPatient = new Patient(
      crypto.randomUUID(), tenantId, data.nomeCompleto, encryptedCpf, encryptedCns,
      new Date(data.dataNascimento), data.sexo, data.nomeMae || null, data.nomePai || null,
      data.enderecoCompleto || null, data.telefone || null, data.contatoEmergencia || null,
      data.convenioId || null, data.numeroCarteirinha || null,
      data.dataValidadeCarteirinha ? new Date(data.dataValidadeCarteirinha) : null,
      data.alergias || [], data.comorbidades || [], data.historicoClinico || null,
      data.grupoSanguineo || null, data.status || 'ATIVO', new Date(), new Date(), null
    );

    return this.patientRepo.createWithMedicalRecord(newPatient, medicalRecordNumero, cpfHash, cnsHash);
  }

  async findAll(tenantId: string, page: number = 1, limit: number = 10, filter?: any) {
    const skip = (page - 1) * limit;
    const { data, total } = await this.patientRepo.findAll(tenantId, skip, limit, filter);
    
    const decryptedData = data.map(patient => ({
      ...patient,
      cpf: this.encryption.decrypt(patient.cpf),
      cns: patient.cns ? this.encryption.decrypt(patient.cns) : null
    }));
    return { data: decryptedData, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.patientRepo.findById(id, tenantId);
    if (!patient) throw new NotFoundException('Paciente não encontrado.');
    return { 
      ...patient, 
      cpf: this.encryption.decrypt(patient.cpf),
      cns: patient.cns ? this.encryption.decrypt(patient.cns) : null 
    } as Patient;
  }

  async update(id: string, tenantId: string, data: UpdatePatientDto): Promise<void> {
    const patient = await this.patientRepo.findById(id, tenantId);
    if (!patient) throw new NotFoundException('Paciente não encontrado.');

    let encryptedCpf = patient.cpf;
    let cpfHash = undefined;
    if (data.cpf) {
      if (!isValidCPF(data.cpf)) throw new BadRequestException('CPF inválido.');
      encryptedCpf = this.encryption.encrypt(data.cpf);
      cpfHash = this.encryption.hash(data.cpf);
    }

    let encryptedCns = patient.cns;
    let cnsHash = undefined;
    if (data.cns !== undefined) {
      if (data.cns && !isValidCNS(data.cns)) throw new BadRequestException('CNS inválido.');
      encryptedCns = data.cns ? this.encryption.encrypt(data.cns) : null;
      cnsHash = data.cns ? this.encryption.hash(data.cns) : null;
    }

    const updatedPatient = new Patient(
      patient.id, patient.tenantId, data.nomeCompleto || patient.nomeCompleto, encryptedCpf, encryptedCns,
      data.dataNascimento ? new Date(data.dataNascimento) : patient.dataNascimento,
      data.sexo || patient.sexo, data.nomeMae !== undefined ? data.nomeMae : patient.nomeMae,
      data.nomePai !== undefined ? data.nomePai : patient.nomePai,
      data.enderecoCompleto !== undefined ? data.enderecoCompleto : patient.enderecoCompleto,
      data.telefone !== undefined ? data.telefone : patient.telefone,
      data.contatoEmergencia !== undefined ? data.contatoEmergencia : patient.contatoEmergencia,
      data.convenioId !== undefined ? data.convenioId : patient.convenioId,
      data.numeroCarteirinha !== undefined ? data.numeroCarteirinha : patient.numeroCarteirinha,
      data.dataValidadeCarteirinha ? new Date(data.dataValidadeCarteirinha) : patient.dataValidadeCarteirinha,
      data.alergias || patient.alergias, data.comorbidades || patient.comorbidades,
      data.historicoClinico !== undefined ? data.historicoClinico : patient.historicoClinico,
      data.grupoSanguineo !== undefined ? data.grupoSanguineo : patient.grupoSanguineo,
      data.status || patient.status, patient.createdAt, new Date(), patient.deletedAt
    );

    await this.patientRepo.update(updatedPatient, cpfHash, cnsHash);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    const hasActiveHosp = await this.patientRepo.hasActiveHospitalizations(id, tenantId);
    if (hasActiveHosp) {
      throw new BadRequestException('Não é possível excluir um paciente com internação ativa.');
    }
    await this.patientRepo.softDelete(id, tenantId);
  }

  async getMedicalRecord(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    const record = await this.patientRepo.getActiveMedicalRecord(id, tenantId);
    if (!record) throw new NotFoundException('Prontuário ativo não encontrado.');
    return record;
  }

  async getHospitalizations(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.patientRepo.getHospitalizations(id, tenantId);
  }
}