import * as z from 'zod';

export const labOrderSchema = z.object({
  patientId: z.string().min(1, 'Selecione o paciente'),
  examIds: z.array(z.string()).min(1, 'Selecione pelo menos um exame'),
  medicalRecordId: z.string().optional(),
});

export const collectionSchema = z.object({
  sampleType: z.string().min(1, 'Informe o tipo de amostra (ex: SANGUE, URINA)'),
});

export const resultEntrySchema = z.object({
  value: z.string().min(1, 'O valor do resultado é obrigatório'),
});

export const signReportSchema = z.object({
  reportText: z.string().min(10, 'O texto do laudo deve ser detalhado'),
});