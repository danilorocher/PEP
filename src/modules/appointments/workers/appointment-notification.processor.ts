import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('whatsapp-notifications')
export class AppointmentNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(AppointmentNotificationProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    const { appointmentId, patientName, patientPhone, doctorName, tenantName, date } = job.data;
    
    this.logger.log(`📱 Processando WhatsApp para: ${patientName} (${patientPhone})`);

    // Formatação da data (Ex: 08/05/2026 às 14:30)
    const dataFormatada = new Intl.DateTimeFormat('pt-BR', { 
      dateStyle: 'short', timeStyle: 'short' 
    }).format(new Date(date));

    // A MENSAGEM PERFEITA
    const mensagem = `Olá, ${patientName}! Tudo bem?\n\nAqui é do ${tenantName}. Estamos passando para lembrar da sua consulta com Dr(a) ${doctorName} amanhã, ${dataFormatada}.\n\nPara confirmar sua presença, clique no link abaixo:\n👉 https://seu-pep-front.com/confirmar/${appointmentId}\n\nCaso não possa comparecer, avise-nos para liberarmos a vaga.`;

    try {
      // 🔥 AQUI ENTRA A SUA API DE WHATSAPP REAL
      // await axios.post('URL_DA_API_ZAPI', { phone: patientPhone, message: mensagem });
      
      // Simulação de disparo com delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logger.log(`✅ Mensagem ENVIADA com sucesso: \n"${mensagem}"`);
      return { success: true, appointmentId };
    } catch (error) {
      this.logger.error(`❌ Falha ao enviar WhatsApp para ${patientPhone}`, error);
      throw error; // Lança o erro para o BullMQ tentar novamente (Retry Pattern)
    }
  }
}