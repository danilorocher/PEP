import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CidService } from './cid.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';

@ApiTags('Catálogo CID-10')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cid')
export class CidController {
  constructor(private readonly cidService: CidService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Sincronizar carga massiva do CID-10 para o banco de dados' })
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  async syncCidData() {
    return this.cidService.syncDatabase();
  }

  @Get()
  @ApiOperation({ summary: 'Pesquisa paginada de doenças (Server-side)' })
  async findAll(
    @Query('search') search: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '15',
  ) {
    return this.cidService.findAll(search, Number(page), Number(limit));
  }
}