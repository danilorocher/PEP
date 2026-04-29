import * as z from 'zod';

// --- SINAIS VITAIS ---
export const vitalSignsSchema = z.object({
  systolicPressure: z.number().min(20).max(300),
  diastolicPressure: z.number().min(10).max(200),
  temperature: z.number().min(30).max(45),
  heartRate: z.number().min(20).max(250),
  respiratoryRate: z.number().min(4).max(60),
  spo2: z.number().min(0).max(100),
  painScale: z.number().min(0).max(10),
  observacoes: z.string().optional(),
});

// --- ESCALA DE BRADEN (Risco de Lesão por Pressão) ---
export const bradenSchema = z.object({
  sensoryPerception: z.number().min(1).max(4),
  moisture: z.number().min(1).max(4),
  activity: z.number().min(1).max(4),
  mobility: z.number().min(1).max(4),
  nutrition: z.number().min(1).max(4),
  frictionShear: z.number().min(1).max(3),
});

// --- ESCALA DE MORSE (Risco de Quedas) ---
export const morseSchema = z.object({
  historyOfFalling: z.number(),
  secondaryDiagnosis: z.number(),
  ambulatoryAid: z.number(),
  ivTherapy: z.number(),
  gait: z.number(),
  mentalStatus: z.number(),
});

// --- ESCALA DE GLASGOW (Avaliação Neurológica) ---
export const glasgowSchema = z.object({
  eyeOpening: z.number().min(1).max(4),
  verbalResponse: z.number().min(1).max(5),
  motorResponse: z.number().min(1).max(6),
  pupilReactivity: z.number().optional(),
});

// --- BALANÇO HÍDRICO (Controle de Período) ---
export const fluidBalanceSchema = z.object({
  dataHoraReferencia: z.any(), // Recebe objeto Dayjs do componente de data
});

// --- BALANÇO HÍDRICO (Lançamento de Itens) ---
export const fluidItemSchema = z.object({
  tipo: z.string().min(1, 'Selecione o tipo de entrada ou saída'),
  volumeMl: z.number().min(1, 'O volume deve ser superior a zero'),
  descricao: z.string().optional(),
});