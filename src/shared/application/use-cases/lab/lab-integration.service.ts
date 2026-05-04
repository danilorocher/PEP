import { Injectable, Logger } from '@nestjs/common';
import { LabUseCases } from './lab.use-cases';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';

@Injectable()
export class LabIntegrationService {
  private readonly logger = new Logger(LabIntegrationService.name);

  constructor(
    private readonly labUseCases: LabUseCases,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Simula a recepção de dados via HL7/ASTM de um equipamento laboratorial.
   * O equipamento envia o Barcode da amostra e o resultado.
   */
  async receiveEquipmentResult(data: { barcode: string; examCode: string; value: string }) {
    this.logger.log(`Recebendo resultado do equipamento - Amostra: ${data.barcode}`);

    // 1. Encontra a amostra e o pedido via Barcode
    const sample = await this.prisma.labSample.findUnique({
      where: { barcode: data.barcode },
      include: { order: { include: { results: { include: { exam: true } } } } }
    });

    if (!sample) {
      this.logger.error(`Amostra com código ${data.barcode} não localizada.`);
      return;
    }

    // 2. Localiza o ID do resultado correspondente ao código do exame (ex: GLI)
    const result = sample.order.results.find(r => r.exam.code === data.examCode);

    if (!result) {
      this.logger.error(`Exame ${data.examCode} não faz parte do pedido ${sample.labOrderId}`);
      return;
    }

    // 3. Processa o resultado automaticamente (usando o sistema de validação de críticos)
    return this.labUseCases.processResult(
      sample.tenantId,
      'SYSTEM-INTEGRATION', // Usuário virtual para equipamentos
      result.id,
      data.value
    );
  }
}