import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { OccupationsService } from './occupations.service';
import { CreateOccupationDto } from './dto/create-occupation.dto';

@Controller('occupations')
export class OccupationsController {
  constructor(private readonly occupationsService: OccupationsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateOccupationDto) {
    return this.occupationsService.create(req.tenantId, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.occupationsService.findAll(req.tenantId);
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