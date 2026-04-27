import { Prescription } from '../entities/prescription.entity';
import { PrescriptionItem } from '../entities/prescription-item.entity';
import { MedicationAdministration } from '../entities/medication-administration.entity';

export interface IPrescriptionRepository {
  createWithItemsAndAdministrations(
    prescription: Prescription, 
    items: PrescriptionItem[], 
    administrations: MedicationAdministration[]
  ): Promise<Prescription>;
  
  findById(id: string, tenantId: string): Promise<Prescription | null>;
  findByMedicalRecordId(medicalRecordId: string, tenantId: string, skip: number, take: number): Promise<{ data: Prescription[]; total: number }>;
  
  updateStatus(id: string, tenantId: string, status: string): Promise<void>;
  
  findItemById(itemId: string): Promise<PrescriptionItem | null>;
  updateItemStatus(itemId: string, status: string): Promise<void>;
  
  cancelPendingAdministrationsByItem(itemId: string, tenantId: string, observacao: string): Promise<void>;
  cancelPendingAdministrationsByPrescription(prescriptionId: string, tenantId: string, observacao: string): Promise<void>;

  addItemWithAdministrations(item: PrescriptionItem, administrations: MedicationAdministration[]): Promise<PrescriptionItem>;
}

export const PRESCRIPTION_REPOSITORY_TOKEN = Symbol('IPrescriptionRepository');