import { Test, TestingModule } from '@nestjs/testing';
import { HospitalizationsUseCases } from './hospitalizations.use-cases';
import { HOSPITALIZATION_REPOSITORY_TOKEN } from '../../../domain/repositories/hospitalization.repository.interface';
import { BED_REPOSITORY_TOKEN } from '../../../domain/repositories/bed.repository.interface';
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../../domain/repositories/medical-record.repository.interface';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('HospitalizationsUseCases', () => {
  let useCases: HospitalizationsUseCases;
  let hospRepo: any;
  let bedRepo: any;
  let recordRepo: any;
  let prisma: any;

  beforeEach(async () => {
    hospRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    bedRepo = {
      findById: jest.fn(),
    };

    recordRepo = {
      findByPatientId: jest.fn(),
    };

    prisma = {
      $transaction: jest.fn().mockImplementation(async (callback) => {
        const tx = {
          hospitalization: { update: jest.fn() },
          bed: { update: jest.fn() },
          medicalRecord: { update: jest.fn() },
          auditLog: { create: jest.fn() },
        };
        return callback(tx);
      }),
      auditLog: { create: jest.fn() }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalizationsUseCases,
        { provide: HOSPITALIZATION_REPOSITORY_TOKEN, useValue: hospRepo },
        { provide: BED_REPOSITORY_TOKEN, useValue: bedRepo },
        { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useValue: recordRepo },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    useCases = module.get<HospitalizationsUseCases>(HospitalizationsUseCases);
  });

  describe('dischargePatient', () => {
    it('deve dar alta hospitalar com sucesso se for médico', async () => {
      hospRepo.findById.mockResolvedValue({ 
        id: 'hosp-1', 
        status: 'ATIVA', 
        bedId: 'bed-1',
        medicalRecordId: 'record-1'
      });

      const dto = {
        cid10AltaId: 'CID-123',
        sumarioAlta: 'Alta concedida',
        condicaoPacienteAlta: 'ALTA_MELHORADO',
      };

      await useCases.dischargePatient('tenant-1', 'hosp-1', 'user-1', 'MEDICO', dto as any, '127.0.0.1', 'jest');

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('deve lançar erro se usuário não tiver permissão para alta', async () => {
      await expect(
        useCases.dischargePatient('tenant-1', 'hosp-1', 'user-1', 'ENFERMEIRO', {} as any, '127.0.0.1', 'jest')
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar erro se a internação não estiver ativa', async () => {
      hospRepo.findById.mockResolvedValue({ id: 'hosp-1', status: 'ALTA' });

      await expect(
        useCases.dischargePatient('tenant-1', 'hosp-1', 'user-1', 'MEDICO', {} as any, '127.0.0.1', 'jest')
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se a internação não for encontrada', async () => {
      hospRepo.findById.mockResolvedValue(null);

      await expect(
        useCases.dischargePatient('tenant-1', 'hosp-1', 'user-1', 'MEDICO', {} as any, '127.0.0.1', 'jest')
      ).rejects.toThrow(NotFoundException);
    });
  });
});