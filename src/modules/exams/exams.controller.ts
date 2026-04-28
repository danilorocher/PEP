import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { CreateExamRequestDto, RegisterResultDto } from './dto/exam-request.dto';
import type { TenantRequest } from '../../common/middlewares/tenant.middleware';
 
@ApiTags('Exams (Exames)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsUseCases: ExamsUseCases,
    private readonly examRequestsUseCases: ExamRequestsUseCases,
  ) {}
 
  // ─── Catálogo ──────────────────────────────────────────────────────────────
  @Post('catalog')
  @ApiOperation({ summary: 'Criar exame no catálogo' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  createExam(@Body() dto: CreateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.create(req.tenant.id, dto);
  }
 
  @Get('catalog')
  @ApiOperation({ summary: 'Listar catálogo de exames' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAllExams(@Req() req: TenantRequest, @Query('page') page: string, @Query('limit') limit: string) {
    return this.examsUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10);
  }
 
  @Patch('catalog/:id')
  @ApiOperation({ summary: 'Atualizar exame no catálogo' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.update(id, req.tenant.id, dto);
  }
 
  @Delete('catalog/:id')
  @ApiOperation({ summary: 'Remover exame do catálogo' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  removeExam(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.examsUseCases.remove(id, req.tenant.id);
  }
 
  // ─── Solicitações ──────────────────────────────────────────────────────────
  @Post('requests')
  @ApiOperation({ summary: 'Solicitar exame para paciente' })
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  createRequest(@Body() dto: CreateExamRequestDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.create(req.tenant.id, userId, dto, ip, ua);
  }
 
  @Get('requests')
  @ApiOperation({ summary: 'Listar solicitações de exames' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAllRequests(
    @Req() req: TenantRequest,
    @Query('patientId') patientId: string,
    @Query('status') status: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.findAll(
      req.tenant.id,
      Number(page) || 1,
      Number(limit) || 10,
      { patientId, status },
      userId,
      ip,
      ua,
    );
  }
 
  @Patch('requests/:id/result')
  @ApiOperation({ summary: 'Registrar resultado de exame' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  registerResult(@Param('id') id: string, @Body() dto: RegisterResultDto, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.registerResult(id, req.tenant.id, dto.resultado, userId, ip, ua);
  }
 
  @Delete('requests/:id')
  @ApiOperation({ summary: 'Cancelar solicitação de exame' })
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  cancelRequest(@Param('id') id: string, @Req() req: TenantRequest) {
    const userId = (req as any).user.sub;
    const ip = req.ip || '';
    const ua = req.headers['user-agent'] || '';
    return this.examRequestsUseCases.cancel(id, req.tenant.id, userId, ip, ua);
  }
}
