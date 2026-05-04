import { Inject, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { INurseRepository, NURSE_REPOSITORY_TOKEN } from '../../../../domain/repositories/nurse.repository.interface';
import { Nurse } from '../../../../domain/entities/nurse.entity';
import { EncryptionService } from '../../../../infrastructure/database/prisma/repositories/services/encryption.service';
import * as crypto from 'crypto';
import { CreateNurseDto, UpdateNurseDto } from '../../../../../modules/nurses/dto/nurse.dto';

// 🔥 Paginação
import { QueryNursesDto } from '../../../../../modules/nurses/dto/query-nurses.dto';
import { buildPaginationQuery, buildPaginatedResult } from '../../../../infrastructure/utils/prisma-pagination.util';

@Injectable()
export class NursesUseCases {
  constructor(
    @Inject(NURSE_REPOSITORY_TOKEN) private readonly nurseRepo: INurseRepository,
    private readonly encryption: EncryptionService,
  ) {}

  async create(tenantId: string, data: CreateNurseDto, requesterRole: string): Promise<Nurse> {
    const encryptedCpf = this.encryption.encrypt(data.cpf);
    if (await this.nurseRepo.findByCpf(encryptedCpf, tenantId)) throw new BadRequestException('CPF já cadastrado.');
    if (await this.nurseRepo.findByCoren(data.coren, data.ufCoren, tenantId)) throw new BadRequestException('COREN já cadastrado.');
    if (data.podePrescrever && requesterRole !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN pode conceder permissão.');

    const encryptedCns = data.cns ? this.encryption.encrypt(data.cns) : null;
    const newNurse = new Nurse(
      crypto.randomUUID(), tenantId, data.userId || null, data.nomeCompleto, encryptedCpf,
      data.coren, data.ufCoren, data.dataExpedicaoCoren ? new Date(data.dataExpedicaoCoren) : null,
      data.categoria, encryptedCns, data.podePrescrever || false, data.status || 'ATIVO',
      new Date(), new Date(), null
    );

    await this.nurseRepo.save(newNurse);
    return newNurse;
  }

  // 🔥 PAGINAÇÃO
  async findAll(tenantId: string, query: QueryNursesDto) {
    const { page, limit, search, categoria, podePrescrever, status } = query;
    const { skip, take } = buildPaginationQuery(page, limit);

    const filters = { search, categoria, podePrescrever, status };
    const { data, total } = await this.nurseRepo.findAll(tenantId, skip, take, filters);
    
    const decryptedData = data.map(nurse => ({
      ...nurse,
      cpf: this.encryption.decrypt(nurse.cpf),
      cns: nurse.cns ? this.encryption.decrypt(nurse.cns) : null
    }));
    return buildPaginatedResult(decryptedData, total, page, limit);
  }

  async findOne(id: string, tenantId: string): Promise<Nurse> {
    const nurse = await this.nurseRepo.findById(id, tenantId);
    if (!nurse) throw new NotFoundException('Enfermeiro não encontrado.');
    return { ...nurse, cpf: this.encryption.decrypt(nurse.cpf), cns: nurse.cns ? this.encryption.decrypt(nurse.cns) : null } as Nurse;
  }

  async update(id: string, tenantId: string, data: UpdateNurseDto, requesterRole: string): Promise<void> {
    const nurse = await this.nurseRepo.findById(id, tenantId);
    if (!nurse) throw new NotFoundException('Enfermeiro não encontrado.');
    if (data.podePrescrever !== undefined && data.podePrescrever !== nurse.podePrescrever && requesterRole !== 'ADMIN') {
      throw new ForbiddenException('Apenas um Administrador pode alterar a permissão de prescrição.');
    }

    const encryptedCpf = data.cpf ? this.encryption.encrypt(data.cpf) : nurse.cpf;
    const encryptedCns = data.cns !== undefined ? (data.cns ? this.encryption.encrypt(data.cns) : null) : nurse.cns;

    if (data.coren && data.ufCoren && (data.coren !== nurse.coren || data.ufCoren !== nurse.ufCoren)) {
      if (await this.nurseRepo.findByCoren(data.coren, data.ufCoren, tenantId)) throw new BadRequestException(`COREN em uso.`);
    }

    const updatedNurse = new Nurse(
      nurse.id, nurse.tenantId, data.userId !== undefined ? data.userId : nurse.userId,
      data.nomeCompleto || nurse.nomeCompleto, encryptedCpf, data.coren || nurse.coren,
      data.ufCoren || nurse.ufCoren, data.dataExpedicaoCoren ? new Date(data.dataExpedicaoCoren) : nurse.dataExpedicaoCoren,
      data.categoria || nurse.categoria, encryptedCns, data.podePrescrever !== undefined ? data.podePrescrever : nurse.podePrescrever,
      data.status || nurse.status, nurse.createdAt, new Date(), nurse.deletedAt
    );
    await this.nurseRepo.update(updatedNurse);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId);
    await this.nurseRepo.softDelete(id, tenantId);
  }
}