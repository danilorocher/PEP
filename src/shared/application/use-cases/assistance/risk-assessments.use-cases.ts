import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/repositories/prisma.service';
import { CreateBradenDto, CreateMorseDto, CreateGlasgowDto } from '../../../../modules/assistance/dto/assistance.dto';

@Injectable()
export class RiskAssessmentsUseCases {
  constructor(private readonly prisma: PrismaService) {}

  async createBraden(tenantId: string, userId: string, data: CreateBradenDto) {
    const totalScore = data.sensoryPerception + data.moisture + data.activity + data.mobility + data.nutrition + data.frictionShear;
    
    // Classificação automática no Backend (Segurança Clínica)
    let classificacao = 'Sem Risco';
    if (totalScore <= 9) classificacao = 'Risco Altíssimo';
    else if (totalScore <= 12) classificacao = 'Risco Alto';
    else if (totalScore <= 14) classificacao = 'Risco Moderado';
    else if (totalScore <= 18) classificacao = 'Risco Baixo';

    return await this.prisma.bradenAssessment.create({
      data: { tenantId, registeredById: userId, totalScore, classificacao, ...data }
    });
  }

  async createMorse(tenantId: string, userId: string, data: CreateMorseDto) {
    const totalScore = data.historyOfFalling + data.secondaryDiagnosis + data.ambulatoryAid + data.ivTherapy + data.gait + data.mentalStatus;
    
    let classificacao = 'Risco Baixo';
    if (totalScore >= 45) classificacao = 'Risco Alto';
    else if (totalScore >= 25) classificacao = 'Risco Moderado';

    return await this.prisma.morseAssessment.create({
      data: { tenantId, registeredById: userId, totalScore, classificacao, ...data }
    });
  }

  async createGlasgow(tenantId: string, userId: string, data: CreateGlasgowDto) {
    // Calculo padrão. Pupil reactivity opcional subtrai pontos na escala moderna.
    let totalScore = data.eyeOpening + data.verbalResponse + data.motorResponse;
    if (data.pupilReactivity) totalScore -= data.pupilReactivity;

    let classificacao = 'Trauma Leve';
    if (totalScore <= 8) classificacao = 'Trauma Grave (Coma)';
    else if (totalScore <= 12) classificacao = 'Trauma Moderado';

    return await this.prisma.glasgowAssessment.create({
      data: { tenantId, registeredById: userId, totalScore, classificacao, ...data }
    });
  }
}