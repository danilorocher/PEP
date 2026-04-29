import * as z from 'zod';

// Esquema para dar entrada em um novo lote de medicamento no estoque
export const addStockSchema = z.object({
  medicationId: z.string().min(1, 'Selecione um medicamento válido.'),
  lote: z.string().min(1, 'O número do lote é obrigatório.'),
  validade: z.any({ required_error: 'A data de validade é obrigatória.' }), // Espera um objeto Dayjs do DatePicker do Ant Design
  quantidade: z.number({ required_error: 'Informe a quantidade.' }).min(0.1, 'A quantidade deve ser maior que zero.'),
  localizacao: z.string().min(1, 'A localização (ex: Farmácia Central) é obrigatória.')
});

// Esquema para o item individual dentro de uma dispensação
export const dispensationItemSchema = z.object({
  prescriptionItemId: z.string().min(1, 'ID do item da prescrição ausente.'),
  stockId: z.string().min(1, 'Selecione de qual lote este medicamento será retirado.'),
  quantidadeDispensada: z.number().min(0.1, 'A quantidade deve ser maior que zero.')
});

// Esquema principal para efetivar a dispensação de uma prescrição
export const dispenseSchema = z.object({
  prescriptionId: z.string().min(1, 'ID da prescrição ausente.'),
  observacoes: z.string().optional(),
  items: z.array(dispensationItemSchema).min(1, 'É necessário dispensar pelo menos um item.')
});

// Esquema para cadastro de regra de interação medicamentosa
export const interactionSchema = z.object({
  medicationAId: z.string().min(1, 'Selecione o primeiro medicamento.'),
  medicationBId: z.string().min(1, 'Selecione o segundo medicamento.'),
  grauSeveridade: z.enum(['LEVE', 'MODERADA', 'GRAVE', 'CONTRAINDICADA'], {
    required_error: 'Selecione a severidade da interação.'
  }),
  descricao: z.string().min(5, 'Forneça uma descrição detalhada da interação.'),
  manejoClinico: z.string().min(5, 'Descreva qual deve ser a conduta clínica (manejo).')
});