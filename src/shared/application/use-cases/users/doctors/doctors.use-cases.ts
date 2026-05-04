import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IDoctorRepository, DOCTOR_REPOSITORY_TOKEN } from '../../../../domain/repositories/doctor.repository.interface';
import { Doctor } from '../../../../domain/entities/doctor.entity';
import { EncryptionService } from '../../../../infrastructure/database/prisma/repositories/services/encryption.service';
import * as crypto from 'crypto';
import { CreateDoctorDto, UpdateDoctorDto } from '../../../../../modules/doctors/dto/doctor.dto';

// 🔥 Paginação
import { QueryDoctorsDto } from '../../../../../modules/doctors/dto/query-doctors.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class DoctorsUseCases {
  constructor(
    @Inject(DOCTOR_REPOSITORY_TOKEN) private readonly doctorRepo: IDoctorRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async create(tenantId: string, data: CreateDoctorDto): Promise<Doctor> {
    const encryptedCpf = this.encryption.encrypt(data.cpf);
    if (await this.doctorRepo.findByCpf(encryptedCpf, tenantId)) throw new BadRequestException('CPF já cadastrado como médico.');
    if (await this.doctorRepo.findByCrm(data.crm, data.ufCrm, tenantId)) throw new BadRequestException(`CRM já cadastrado.`);
    const encryptedCns = data.cns ? this.encryption.encrypt(data.cns) : null;

    const newDoctor = new Doctor(
      crypto.randomUUID(), tenantId, data.userId || null, data.nomeCompleto, encryptedCpf,
      data.crm, data.ufCrm, data.dataExpedicaoCrm ? new Date(data.dataExpedicaoCrm) : null,
      encryptedCns, data.telefoneProfissional || null, data.emailProfissional || null,
      data.registroSecundario || null, null, data.status || 'ATIVO',
      new Date(), new Date(), null, data.specialties || []
    );

    await this.doctorRepo.save(newDoctor);
    return newDoctor;
  }

  // 🔥 PAGINAÇÃO CORRIGIDA (Agrupando os filtros)
  async findAll(tenantId: string, query: QueryDoctorsDto) {
    const { page, limit, search, specialtyId, status } = query;
    const { skip, take } = buildPaginationQuery(page, limit);

    // Agrupa os filtros num único objeto
    const filters = { search, specialtyId, status };

    // Passa os 4 argumentos que a Interface IDoctorRepository exige
    const { data, total } = await this.doctorRepo.findAll(tenantId, skip, take, filters);
    
    const decryptedData = data.map(doc => ({
      ...doc,
      cpf: this.encryption.decrypt(doc.cpf),
      cns: doc.cns ? this.encryption.decrypt(doc.cns) : null
    }));
    return buildPaginatedResult(decryptedData, total, page, limit);
  }

  async findOne(id: string, tenantId: string): Promise<Doctor> {
    const doctor = await this.doctorRepo.findById(id, tenantId);
    if (!doctor) throw new NotFoundException('Médico não encontrado.');
    return { ...doctor, cpf: this.encryption.decrypt(doctor.cpf), cns: doctor.cns ? this.encryption.decrypt(doctor.cns) : null } as Doctor;
  }

  async update(id: string, tenantId: string, data: UpdateDoctorDto): Promise<void> {
    const doctor = await this.doctorRepo.findById(id, tenantId);
    if (!doctor) throw new NotFoundException('Médico não encontrado.');
    const encryptedCpf = data.cpf ? this.encryption.encrypt(data.cpf) : doctor.cpf;
    const encryptedCns = data.cns !== undefined ? (data.cns ? this.encryption.encrypt(data.cns) : null) : doctor.cns;

    if (data.crm && data.ufCrm && (data.crm !== doctor.crm || data.ufCrm !== doctor.ufCrm)) {
      if (await this.doctorRepo.findByCrm(data.crm, data.ufCrm, tenantId)) throw new BadRequestException(`CRM já está em uso.`);
    }

    const updatedDoctor = new Doctor(
      doctor.id, doctor.tenantId, data.userId !== undefined ? data.userId : doctor.userId,
      data.nomeCompleto || doctor.nomeCompleto, encryptedCpf, data.crm || doctor.crm,
      data.ufCrm || doctor.ufCrm, data.dataExpedicaoCrm ? new Date(data.dataExpedicaoCrm) : doctor.dataExpedicaoCrm,
      encryptedCns, data.telefoneProfissional !== undefined ? data.telefoneProfissional : doctor.telefoneProfissional,
      data.emailProfissional !== undefined ? data.emailProfissional : doctor.emailProfissional,
      data.registroSecundario !== undefined ? data.registroSecundario : doctor.registroSecundario,
      doctor.assinaturaDigitalPath, data.status || doctor.status, doctor.createdAt, new Date(), doctor.deletedAt,
      data.specialties || doctor.specialties
    );
    await this.doctorRepo.update(updatedDoctor);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.doctorRepo.softDelete(id, tenantId);
  }
}