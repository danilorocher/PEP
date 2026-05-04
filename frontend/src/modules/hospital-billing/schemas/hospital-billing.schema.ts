import * as z from 'zod';

export const susBillingSchema = z.object({
  type: z.enum(['AIH', 'BPA'], { required_error: 'Selecione o tipo de faturação SUS' }),
});

export const denialSchema = z.object({
  reason: z.string().min(5, 'Informe o motivo detalhado da glosa.'),
  amountDenied: z.number({ required_error: 'Informe o valor' }).min(0.01, 'O valor glosado deve ser maior que zero.'),
});

export const drgSchema = z.object({
  code: z.string().min(1, 'Código DRG é obrigatório.'),
  description: z.string().min(5, 'Descrição do DRG obrigatória.'),
  averageCost: z.number().min(0, 'Custo médio inválido.'),
});