import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { CreateExamRequestDto, RegisterResultDto } from './dto/exam-request.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';
import { QueryExamsDto } from './dto/query-exams.dto';
import { QueryExamRequestsDto } from './dto/query-exam-requests.dto';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';
 
@ApiTags('Exams (Exames)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsUseCases: ExamsUseCases,
    private readonly examRequestsUseCases: ExamRequestsUseCases,
  ) {}
 
  @Post('catalog')
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  createExam(@Body() dto: CreateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.create(req.tenant.id, dto);
  }
 
  @Get('catalog')
  @TransformResponse()
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAllExams(@Req() req: TenantRequest, @Query() query: QueryExamsDto) {
    return this.examsUseCases.findAll(req.tenant.id, query);
  }
 
  @Patch('catalog/:id')
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.update(id, req.tenant.id, dto);
  }
 
  @Delete('catalog/:id')
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  removeExam(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.examsUseCases.remove(id, req.tenant.id);
  }
 
  @Post('requests')
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  createRequest(@Body() dto: CreateExamRequestDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.examRequestsUseCases.create(req.tenant.id, userId, dto, req.ip || '', req.headers['user-agent'] || '');
  }
 
  @Get('requests')
  @TransformResponse()
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAllRequests(@Req() req: TenantRequest, @Query() query: QueryExamRequestsDto) {
    const userId = (req as any).user.sub;
    return this.examRequestsUseCases.findAll(req.tenant.id, query, userId, req.ip || '', req.headers['user-agent'] || '');
  }
 
  @Patch('requests/:id/result')
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  registerResult(@Param('id') id: string, @Body() dto: RegisterResultDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.examRequestsUseCases.registerResult(id, req.tenant.id, dto.resultado, userId, req.ip || '', req.headers['user-agent'] || '');
  }
 
  @Delete('requests/:id')
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  cancelRequest(@Param('id') id: string, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    return this.examRequestsUseCases.cancel(id, req.tenant.id, userId, req.ip || '', req.headers['user-agent'] || '');
  }
}