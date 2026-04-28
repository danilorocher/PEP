import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';
import { EXAM_REPOSITORY_TOKEN } from '../../shared/domain/repositories/exam.repository.interface';
import { PrismaExamRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-exam.repository';
import { EXAM_REQUEST_REPOSITORY_TOKEN } from '../../shared/domain/repositories/exam-request.repository.interface';
import { PrismaExamRequestRepository } from '../../shared/infrastructure/database/prisma/repositories/prisma-exam-request.repository';
 
@Module({
  controllers: [ExamsController],
  providers: [
    ExamsUseCases,
    ExamRequestsUseCases,
    { provide: EXAM_REPOSITORY_TOKEN, useClass: PrismaExamRepository },
    { provide: EXAM_REQUEST_REPOSITORY_TOKEN, useClass: PrismaExamRequestRepository },
  ],
  exports: [ExamsUseCases, ExamRequestsUseCases],
})
export class ExamsModule {}
