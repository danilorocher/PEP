import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PERMISSION_TEMPLATES } from '../../shared/constants/permission-templates.constant';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permissions')
export class PermissionsController {
  @Get('templates')
  getTemplates() {
    return Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => ({
      key,
      label: template.label,
      descricao: template.descricao,
      cor: template.cor,
      icone: template.icone,
      permissoes: template.permissoes,
    }));
  }
}