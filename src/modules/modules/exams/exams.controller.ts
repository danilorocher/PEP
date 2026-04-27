import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { ExamsUseCases } from '../../shared/application/use-cases/exams/exams.use-cases';
import { CreateExamDto, UpdateExamDto } from './dto/exam.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Exams Catalog (Catálogo de Exames)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsUseCases: ExamsUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Criar exame no catálogo' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() dto: CreateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.create(req.tenant!.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar catálogo de exames' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findAll(@Req() req: TenantRequest, @Query('page') page: string, @Query('limit') limit: string) {
    return this.examsUseCases.findAll(req.tenant!.id, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter exame do catálogo' })
  @RequirePermissions({ module: 'exames', action: 'visualizar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.examsUseCases.findOne(id, req.tenant!.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar exame do catálogo' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() dto: UpdateExamDto, @Req() req: TenantRequest) {
    return this.examsUseCases.update(id, req.tenant!.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover exame do catálogo' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.examsUseCases.remove(id, req.tenant!.id);
  }
}