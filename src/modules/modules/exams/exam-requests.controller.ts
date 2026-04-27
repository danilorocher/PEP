import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query, Headers, Ip } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { ExamRequestsUseCases } from '../../shared/application/use-cases/exams/exam-requests.use-cases';
import { CreateExamRequestDto, UpdateExamResultDto } from './dto/exam-request.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Exam Requests (Solicitações de Exames)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exam-requests')
export class ExamRequestsController {
  constructor(private readonly examRequestsUseCases: ExamRequestsUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Solicitar exame para paciente' })
  @RequirePermissions({ module: 'exames', action: 'solicitar' })
  create(
    @Body() dto: CreateExamRequestDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.examRequestsUseCases.create(req.tenant!.id, userId, dto, ip, userAgent || 'N/A');
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitações de exames' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAll(
    @Req() req: TenantRequest,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('patientId') patientId: string,
    @Query('medicalRecordId') medicalRecordId: string,
    @Query('status') status: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    const filters = { patientId, medicalRecordId, status };
    return this.examRequestsUseCases.findAll(req.tenant!.id, Number(page) || 1, Number(limit) || 10, filters, userId, ip, userAgent || 'N/A');
  }

  @Patch(':id/result')
  @ApiOperation({ summary: 'Laudar resultado de exame' })
  @RequirePermissions({ module: 'exames', action: 'liberar' })
  updateResult(
    @Param('id') id: string,
    @Body() dto: UpdateExamResultDto,
    @Req() req: TenantRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ) {
    const userId = (req as any).user.sub;
    return this.examRequestsUseCases.updateResult(req.tenant!.id, id, userId, dto, ip, userAgent || 'N/A');
  }
}