import { Inject, Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { IPrescriptionRepository, PRESCRIPTION_REPOSITORY_TOKEN } from '../../../domain/repositories/prescription.repository.interface';
import { IMedicalRecordRepository, MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { INurseRepository, NURSE_REPOSITORY_TOKEN } from '../../../domain/repositories/nurse.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { Prescription } from '../../../domain/entities/prescription.entity';
import { PrescriptionItem } from '../../../domain/entities/prescription-item.entity';
import { MedicationAdministration } from '../../../domain/entities/medication-administration.entity';
import * as crypto from 'crypto';
import { CreatePrescriptionDto, CreatePrescriptionItemDto, SuspendPrescriptionDto } from '../../../../modules/prescriptions/dto/prescription.dto';

@Injectable()
export class PrescriptionsUseCases {
  constructor(
    @Inject(PRESCRIPTION_REPOSITORY_TOKEN) private readonly prescriptionRepo: IPrescriptionRepository,
    @Inject(MEDICAL_RECORD_REPOSITORY_TOKEN) private readonly medicalRecordRepo: IMedicalRecordRepository,
    @Inject(NURSE_REPOSITORY_TOKEN) private readonly nurseRepo: INurseRepository,
    private readonly prisma: PrismaService, // 🔥 INJETADO: Acesso global ao Prisma para validação Zero Trust
  ) {}

  // 🔥 CORREÇÃO: Função reescrita para ir ao banco confirmar a identidade real do prescritor
  private async checkPrescriberPermission(userId: string, roleToken: string, tenantId: string): Promise<string> {
    // 1. Bypass VIP para o Administrador Master (Permite testes e auditorias)
    if (roleToken === 'MASTER_ADMIN') {
      return 'MASTER_ADMIN';
    }

    // 2. Confirmação Zero Trust: Verifica se o usuário é realmente um Médico nesta unidade
    const doctor = await this.prisma.doctor.findFirst({
      where: { userId, tenantId, deletedAt: null }
    });
    
    if (doctor) {
      return 'MEDICO';
    }

    // 3. Confirmação Zero Trust: Verifica se é Enfermeiro nesta unidade
    const nurse = await this.nurseRepo.findByUserId(userId, tenantId);
    if (nurse) {
      if (!nurse.podePrescrever) {
        throw new ForbiddenException('Este enfermeiro não possui permissão em seu cadastro para prescrever.');
      }
      return 'ENFERMEIRO';
    }

    throw new ForbiddenException('Acesso negado: Apenas médicos e enfermeiros autorizados podem assinar prescrições.');
  }

  private generateAdministrations(
    tenantId: string, 
    itemId: string, 
    hospitalizationId: string | null, 
    dataInicio: Date, 
    duracaoDias: number, 
    horariosProgramados: string[]
  ): MedicationAdministration[] {
    const administrations: MedicationAdministration[] = [];
    const dias = duracaoDias > 0 ? duracaoDias : 1;

    for (let dia = 0; dia < dias; dia++) {
      for (const horario of horariosProgramados) {
        const [hora, minuto] = horario.split(':').map(Number);
        
        const dataProgramada = new Date(dataInicio);
        dataProgramada.setDate(dataProgramada.getDate() + dia);
        dataProgramada.setHours(hora, minuto, 0, 0);

        administrations.push(new MedicationAdministration(
          crypto.randomUUID(), tenantId, itemId, hospitalizationId, null,
          dataProgramada, null, 'NAO_MINISTRADO', null, new Date(), new Date(), null
        ));
      }
    }

    return administrations;
  }

  async create(tenantId: string, recordId: string, userId: string, userRole: string, data: CreatePrescriptionDto, ip: string, userAgent: string): Promise<Prescription> {
    const record = await this.medicalRecordRepo.findById(recordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');
    if (record.status === 'FECHADO' || record.status === 'ARQUIVADO') {
      throw new ForbiddenException('Não é possível criar prescrições em um prontuário fechado.');
    }

    // 🔥 CORREÇÃO: Descobre e armazena o tipo REAL do prescritor validado no banco
    const tipoPrescritor = await this.checkPrescriberPermission(userId, userRole, tenantId);

    const prescriptionId = crypto.randomUUID();
    const prescription = new Prescription(
      prescriptionId, tenantId, recordId, data.hospitalizationId || null,
      userId, tipoPrescritor, new Date(), 'ATIVA', data.observacoes || null,
      data.assinadaDigitalmente || false, data.assinaturaHash || null,
      new Date(), new Date(), null
    );

    const items: PrescriptionItem[] = [];
    let allAdministrations: MedicationAdministration[] = [];

    for (const itemDto of data.items) {
      const itemId = crypto.randomUUID();
      const dataInicio = new Date(itemDto.dataInicio);
      const duracaoDias = itemDto.duracaoDias || 1;
      
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + duracaoDias);

      const item = new PrescriptionItem(
        itemId, prescriptionId, itemDto.medicationId, itemDto.dosagem,
        itemDto.viaAdministracao, itemDto.frequencia, itemDto.horariosProgramados,
        duracaoDias, dataInicio, dataFim, itemDto.observacoes || null,
        'ATIVO', new Date(), new Date(), null
      );

      const itemAdmins = this.generateAdministrations(
        tenantId, itemId, data.hospitalizationId || null, dataInicio, duracaoDias, itemDto.horariosProgramados
      );

      items.push(item);
      allAdministrations = allAdministrations.concat(itemAdmins);
    }

    const created = await this.prescriptionRepo.createWithItemsAndAdministrations(prescription, items, allAdministrations);
    await this.medicalRecordRepo.logAccess(tenantId, userId, record.patientId, 'CRIAR_PRESCRICAO', ip, userAgent);

    return created;
  }

  async findAllByMedicalRecord(tenantId: string, recordId: string, page: number, limit: number, userId: string, ip: string, userAgent: string) {
    const record = await this.medicalRecordRepo.findById(recordId, tenantId);
    if (!record) throw new NotFoundException('Prontuário não encontrado.');

    const skip = (page - 1) * limit;
    const result = await this.prescriptionRepo.findByMedicalRecordId(recordId, tenantId, skip, limit);

    await this.medicalRecordRepo.logAccess(tenantId, userId, record.patientId, 'LISTAR_PRESCRICOES', ip, userAgent);

    return { data: result.data, total: result.total, page, limit };
  }

  async suspendPrescription(tenantId: string, prescriptionId: string, userId: string, data: SuspendPrescriptionDto, ip: string, userAgent: string): Promise<void> {
    const prescription = await this.prescriptionRepo.findById(prescriptionId, tenantId);
    if (!prescription) throw new NotFoundException('Prescrição não encontrada.');
    if (prescription.status !== 'ATIVA') throw new BadRequestException('Apenas prescrições ativas podem ser suspensas.');

    const record = await this.medicalRecordRepo.findById(prescription.medicalRecordId, tenantId);

    await this.prescriptionRepo.updateStatus(prescriptionId, tenantId, 'SUSPENSA');
    await this.prescriptionRepo.cancelPendingAdministrationsByPrescription(
      prescriptionId, tenantId, `Prescrição suspensa: ${data.observacao}`
    );

    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, 'SUSPENDER_PRESCRICAO', ip, userAgent);
  }

  async addItem(tenantId: string, prescriptionId: string, userId: string, userRole: string, data: CreatePrescriptionItemDto, ip: string, userAgent: string): Promise<PrescriptionItem> {
    const prescription = await this.prescriptionRepo.findById(prescriptionId, tenantId);
    if (!prescription) throw new NotFoundException('Prescrição não encontrada.');
    if (prescription.status !== 'ATIVA') throw new BadRequestException('Não é possível adicionar itens a uma prescrição inativa.');

    // 🔥 CORREÇÃO: Re-valida a permissão para adição de novos itens na prescrição
    await this.checkPrescriberPermission(userId, userRole, tenantId);

    const record = await this.medicalRecordRepo.findById(prescription.medicalRecordId, tenantId);

    const itemId = crypto.randomUUID();
    const dataInicio = new Date(data.dataInicio);
    const duracaoDias = data.duracaoDias || 1;
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + duracaoDias);

    const item = new PrescriptionItem(
      itemId, prescriptionId, data.medicationId, data.dosagem,
      data.viaAdministracao, data.frequencia, data.horariosProgramados,
      duracaoDias, dataInicio, dataFim, data.observacoes || null,
      'ATIVO', new Date(), new Date(), null
    );

    const administrations = this.generateAdministrations(
      tenantId, itemId, prescription.hospitalizationId, dataInicio, duracaoDias, data.horariosProgramados
    );

    const created = await this.prescriptionRepo.addItemWithAdministrations(item, administrations);
    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, 'ADICIONAR_ITEM_PRESCRICAO', ip, userAgent);

    return created;
  }

  async cancelItem(tenantId: string, itemId: string, userId: string, data: SuspendPrescriptionDto, ip: string, userAgent: string): Promise<void> {
    const item = await this.prescriptionRepo.findItemById(itemId);
    if (!item) throw new NotFoundException('Item de prescrição não encontrado.');
    if (item.status !== 'ATIVO') throw new BadRequestException('Apenas itens ativos podem ser cancelados.');

    const prescription = await this.prescriptionRepo.findById(item.prescriptionId, tenantId);
    const record = await this.medicalRecordRepo.findById(prescription!.medicalRecordId, tenantId);

    await this.prescriptionRepo.updateItemStatus(itemId, 'CANCELADO');
    await this.prescriptionRepo.cancelPendingAdministrationsByItem(
      itemId, tenantId, `Item cancelado: ${data.observacao}`
    );

    await this.medicalRecordRepo.logAccess(tenantId, userId, record!.patientId, 'CANCELAR_ITEM_PRESCRICAO', ip, userAgent);
  }
}