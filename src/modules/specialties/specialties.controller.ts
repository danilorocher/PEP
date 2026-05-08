import { Controller, Get, Post, Body, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('specialties')
@UseGuards(JwtAuthGuard)
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateSpecialtyDto) {
    // 🔥 CORREÇÃO: Extraímos o ID do tenant do objeto req.tenant preenchido pelo middleware
    return this.specialtiesService.create(req.tenant.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    // 🔥 CORREÇÃO: Buscamos apenas as especialidades da unidade logada
    return this.specialtiesService.findAll(req.tenant.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}