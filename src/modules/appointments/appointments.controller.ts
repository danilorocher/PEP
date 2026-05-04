import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { AppointmentsUseCases } from '../../shared/application/use-cases/appointments/appointments.use-cases';
import { CreateAppointmentDto, CancelAppointmentDto, FinishAppointmentDto } from './dto/appointment.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

import { QueryAppointmentsDto } from './dto/query-appointments.dto';
import { TransformResponse } from '../../shared/interceptors/transform.interceptor';

@ApiTags('Appointments (Agendamentos)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly apptUseCases: AppointmentsUseCases) {}

  @Post()
  @ApiOperation({ summary: 'Criar agendamento (Verifica conflitos e agenda notificação)' })
  @RequirePermissions({ module: 'agendamento', action: 'criar' })
  create(@Body() dto: CreateAppointmentDto, @Req() req: TenantRequest) {
    return this.apptUseCases.create(req.tenant.id, dto);
  }

  @Get('today')
  @TransformResponse()
  @ApiOperation({ summary: 'Listar a agenda de hoje (Dashboard)' })
  @RequirePermissions({ module: 'agendamento', action: 'visualizar' })
  findToday(@Req() req: TenantRequest) {
    return this.apptUseCases.findToday(req.tenant.id);
  }

  @Get('doctor/:doctorId/availability')
  @ApiOperation({ summary: 'Verifica se o médico está livre no horário especificado' })
  @RequirePermissions({ module: 'agendamento', action: 'visualizar' })
  checkAvailability(
    @Param('doctorId') doctorId: string, 
    @Query('dataHora') dataHora: string, 
    @Query('duracao') duracao: string, 
    @Req() req: TenantRequest
  ) {
    return this.apptUseCases.checkAvailability(doctorId, req.tenant.id, dataHora, Number(duracao));
  }

  @Get()
  @TransformResponse()
  @RequirePermissions({ module: 'agendamento', action: 'visualizar' })
  findAll(@Req() req: TenantRequest, @Query() query: QueryAppointmentsDto) {
    return this.apptUseCases.findAll(req.tenant.id, query);
  }

  @Patch(':id/confirm')
  @ApiOperation({ summary: 'Confirmar agendamento (Gera Guia de Faturamento se tiver convênio)' })
  @RequirePermissions({ module: 'agendamento', action: 'criar' })
  confirm(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.apptUseCases.confirm(id, req.tenant.id);
  }

  @Patch(':id/cancel')
  @RequirePermissions({ module: 'agendamento', action: 'cancelar' })
  cancel(@Param('id') id: string, @Body() dto: CancelAppointmentDto, @Req() req: TenantRequest) {
    return this.apptUseCases.cancel(id, req.tenant.id, dto);
  }

  @Patch(':id/start')
  @RequirePermissions({ module: 'agendamento', action: 'criar' })
  start(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.apptUseCases.start(id, req.tenant.id);
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Finalizar atendimento (Exige CID-10)' })
  @RequirePermissions({ module: 'agendamento', action: 'criar' })
  finish(@Param('id') id: string, @Body() dto: FinishAppointmentDto, @Req() req: TenantRequest) {
    return this.apptUseCases.finish(id, req.tenant.id, dto);
  }
}