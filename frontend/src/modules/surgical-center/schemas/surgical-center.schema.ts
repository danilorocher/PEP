import * as z from 'zod';

// --- AGENDAMENTO ---
export const scheduleSurgerySchema = z.object({
  patientId: z.string().min(1, 'Selecione o paciente.'),
  medicalRecordId: z.string().optional(),
  procedimento: z.string().min(5, 'Descreva o procedimento cirúrgico.'),
  dataCirurgia: z.any({ required_error: 'A data e hora são obrigatórias.' }), // Dayjs object
  salaId: z.string().min(1, 'Selecione a sala cirúrgica.'),
  cirurgiaoId: z.string().min(1, 'Selecione o cirurgião principal.'),
  anestesistaId: z.string().min(1, 'Selecione o anestesista.'),
  enfermeiroId: z.string().min(1, 'Selecione o enfermeiro circulante.'),
  prioridade: z.enum(['ELETIVA', 'URGENCIA', 'EMERGENCIA'], {
    required_error: 'Defina a prioridade da cirurgia.',
  }),
  observacoes: z.string().optional(),
});

// --- CHECKLIST PRÉ-OPERATÓRIO (OMS) ---
// Todos devem ser marcados como TRUE para permitir o início da cirurgia
export const preOpChecklistSchema = z.object({
  pacienteConfirmado: z.boolean().refine(val => val === true, 'Confirmação obrigatória'),
  lateralidadeConfirmada: z.boolean().refine(val => val === true, 'Confirmação obrigatória'),
  jejumConfirmado: z.boolean().refine(val => val === true, 'Confirmação obrigatória'),
  consentimentoAssinado: z.boolean().refine(val => val === true, 'Confirmação obrigatória'),
  alergiasVerificadas: z.boolean().refine(val => val === true, 'Confirmação obrigatória'),
});

// --- REGISTRO ANESTÉSICO ---
export const anesthesiaRecordSchema = z.object({
  tipoAnestesia: z.string().min(1, 'Informe o tipo de anestesia (ex: Geral, Raquidiana).'),
  // Em uma interface real, drogas e sinaisVitais seriam arrays/objetos dinâmicos.
  // Aqui usamos string para simplificar o formulário base, que depois parseamos para JSON.
  drogasUtilizadasRaw: z.string().min(1, 'Liste as drogas utilizadas.'),
  sinaisVitaisRaw: z.string().min(1, 'Registre os parâmetros vitais base.'),
  inicio: z.any({ required_error: 'A hora de início é obrigatória.' }),
  fim: z.any().optional(),
});

// --- RELATÓRIO CIRÚRGICO ---
export const surgicalReportSchema = z.object({
  descricaoProcedimento: z.string().min(10, 'A descrição do procedimento deve ser detalhada.'),
  intercorrencias: z.string().optional(),
  materiaisUtilizados: z.string().optional(),
});

// --- OPME ---
export const opmeItemSchema = z.object({
  opmeId: z.string().min(1, 'Selecione o material/implante.'),
  quantidade: z.number().min(0.1, 'Quantidade inválida.'),
});

export const opmeUsageSchema = z.object({
  items: z.array(opmeItemSchema).min(1, 'Adicione pelo menos um item OPME.'),
});

// --- PÓS-OPERATÓRIO (SRPA) ---
export const postOpChecklistSchema = z.object({
  nivelConsciencia: z.string().min(1, 'Avalie o nível de consciência (Escala de Aldrete).'),
  dor: z.number().min(0).max(10, 'A escala de dor deve ser entre 0 e 10.'),
  sinaisVitaisRaw: z.string().min(1, 'Registre os sinais vitais na admissão e alta da SRPA.'),
  liberadoAlta: z.boolean().default(false),
});