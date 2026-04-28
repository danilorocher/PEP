import { Module } from '@nestjs/common';

// Controller
import { ExamsController } from './exams.controller';

// UseCases
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';

// Repositories (Exams)
import { EXAM_REPOSITORY_TOKEN } from '../../shared/domain/repositories/exam.repository.interface';
import { PrismaExamRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-exam.repository';

// Repositories (Exam Requests)
import { EXAM_REQUEST_REPOSITORY_TOKEN } from '../../shared/domain/repositories/exam-request.repository.interface';
import { PrismaExamRequestRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-exam-request.repository';

// 🔥 IMPORTANTE — Medical Record (ERA ISSO QUE FALTAVA)
import { MEDICAL_RECORD_REPOSITORY_TOKEN } from '../../shared/domain/repositories/medical-record.repository.interface';
import { PrismaMedicalRecordRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-medical-record.repository';

@Module({
  controllers: [ExamsController],
  providers: [
    ExamsUseCases,
    ExamRequestsUseCases,

    // Exams
    { provide: EXAM_REPOSITORY_TOKEN, useClass: PrismaExamRepository },

    // Exam Requests
    { provide: EXAM_REQUEST_REPOSITORY_TOKEN, useClass: PrismaExamRequestRepository },

    // 🔥 CORREÇÃO PRINCIPAL
    { provide: MEDICAL_RECORD_REPOSITORY_TOKEN, useClass: PrismaMedicalRecordRepository },
  ],
  exports: [ExamsUseCases, ExamRequestsUseCases],
})
export class ExamsModule {}