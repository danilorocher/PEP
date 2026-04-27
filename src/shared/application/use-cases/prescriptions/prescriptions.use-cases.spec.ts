import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsUseCases } from './prescriptions.use-cases';
import { PRESCRIPTION_REPOSITORY_TOKEN } from '../../../domain/repositories/prescription.repository.interface';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { NURSE_REPOSITORY_TOKEN } from '../../../domain/repositories/nurse.repository.interface';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

describe('PrescriptionsUseCases', () => {
  let useCases: PrescriptionsUseCases;
  let prescriptionRepo: any;
  let medicalRecordRepo: any;
  let nurseRepo: any;

  beforeEach(async () => {
    prescriptionRepo = {
      createWithItemsAndAdministrations: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      cancelPendingAdministrationsByPrescription: jest.fn(),
    };

    medicalRecordRepo = {
      findById: jest.fn(),
      logAccess: jest.fn(),
    };

    nurseRepo = {
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsUseCases,
        { provide: PRESCRIPTION_REPOSITORY_TOKEN, useValue: prescriptionRepo },
        { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useValue: medicalRecordRepo },
        { provide: NURSE_REPOSITORY_TOKEN, useValue: nurseRepo },
      ],
    }).compile();

    useCases = module.get<PrescriptionsUseCases>(PrescriptionsUseCases);
  });

  describe('create', () => {
    it('deve criar uma prescrição com sucesso se for médico', async () => {
      medicalRecordRepo.findById.mockResolvedValue({ id: 'record-1', status: 'ABERTO', patientId: 'patient-1' });
      prescriptionRepo.createWithItemsAndAdministrations.mockResolvedValue({ id: 'presc-1' });

      const dto = { items: [] };
      const result = await useCases.create('tenant-1', 'record-1', 'user-1', 'MEDICO', dto as any, '127.0.0.1', 'jest');

      expect(result).toBeDefined();
      expect(medicalRecordRepo.logAccess).toHaveBeenCalled();
    });

    it('deve criar uma prescrição com sucesso se for enfermeiro com permissão', async () => {
      medicalRecordRepo.findById.mockResolvedValue({ id: 'record-1', status: 'ABERTO', patientId: 'patient-1' });
      nurseRepo.findByUserId.mockResolvedValue({ podePrescrever: true });
      prescriptionRepo.createWithItemsAndAdministrations.mockResolvedValue({ id: 'presc-1' });

      const dto = { items: [] };
      const result = await useCases.create('tenant-1', 'record-1', 'user-1', 'ENFERMEIRO', dto as any, '127.0.0.1', 'jest');

      expect(result).toBeDefined();
    });

    it('deve lançar erro se enfermeiro não tiver permissão', async () => {
      medicalRecordRepo.findById.mockResolvedValue({ id: 'record-1', status: 'ABERTO' });
      nurseRepo.findByUserId.mockResolvedValue({ podePrescrever: false });

      await expect(
        useCases.create('tenant-1', 'record-1', 'user-1', 'ENFERMEIRO', { items: [] } as any, '127.0.0.1', 'jest')
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar erro se o prontuário estiver fechado', async () => {
      medicalRecordRepo.findById.mockResolvedValue({ id: 'record-1', status: 'FECHADO' });

      await expect(
        useCases.create('tenant-1', 'record-1', 'user-1', 'MEDICO', { items: [] } as any, '127.0.0.1', 'jest')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('suspendPrescription', () => {
    it('deve suspender prescrição e cancelar administrações', async () => {
      prescriptionRepo.findById.mockResolvedValue({ id: 'presc-1', status: 'ATIVA', medicalRecordId: 'record-1' });
      medicalRecordRepo.findById.mockResolvedValue({ id: 'record-1', patientId: 'patient-1' });

      await useCases.suspendPrescription('tenant-1', 'presc-1', 'user-1', { observacao: 'Teste' }, '127.0.0.1', 'jest');

      expect(prescriptionRepo.updateStatus).toHaveBeenCalledWith('presc-1', 'tenant-1', 'SUSPENSA');
      expect(prescriptionRepo.cancelPendingAdministrationsByPrescription).toHaveBeenCalled();
      expect(medicalRecordRepo.logAccess).toHaveBeenCalled();
    });

    it('deve lançar erro se prescrição não estiver ativa', async () => {
      prescriptionRepo.findById.mockResolvedValue({ id: 'presc-1', status: 'SUSPENSA' });

      await expect(
        useCases.suspendPrescription('tenant-1', 'presc-1', 'user-1', { observacao: 'Teste' }, '127.0.0.1', 'jest')
      ).rejects.toThrow(BadRequestException);
    });
  });
});