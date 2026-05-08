import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { OccupationsService } from './occupations.service';
import { CreateOccupationDto } from './dto/create-occupation.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('occupations')
@UseGuards(JwtAuthGuard) // Garante que apenas usuários logados acessem
export class OccupationsController {
  constructor(private readonly occupationsService: OccupationsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOccupationDto) {
    // 🔥 CORREÇÃO: O middleware injeta os dados em req.tenant.id
    return this.occupationsService.create(req.tenant.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    // 🔥 CORREÇÃO: Acessando o ID da unidade corretamente
    return this.occupationsService.findAll(req.tenant.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.occupationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.occupationsService.remove(id);
  }
}