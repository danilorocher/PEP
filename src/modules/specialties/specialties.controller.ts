import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Post()
  create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Get()
  findAll() {
    return this.specialtiesService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}