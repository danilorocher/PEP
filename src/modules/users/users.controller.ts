import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { RequirePermissions } from '../../shared/decorators/permissions.decorator';
import { UsersUseCases } from '../../shared/application/use-cases/users/users.use-cases';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './dto/user.dto';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@ApiTags('Users (Colaboradores e Acesso)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersUseCases: UsersUseCases) {}

  @Post()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  create(@Body() createUserDto: CreateUserDto, @Req() req: TenantRequest) {
    return this.usersUseCases.create(req.tenant.id, createUserDto);
  }

  @Get()
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findAll(@Req() req: TenantRequest, @Query('page') page: string, @Query('limit') limit: string) {
    return this.usersUseCases.findAll(req.tenant.id, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  findOne(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.usersUseCases.findOne(id, req.tenant.id);
  }

  @Patch('me/change-password')
  changePassword(@Body() data: ChangePasswordDto, @Req() req: TenantRequest) {
    // Qualquer usuário autenticado pode trocar a própria senha (sem RequirePermissions)
    const userId = (req as any).user.sub;
    return this.usersUseCases.changePassword(userId, req.tenant.id, data);
  }

  @Patch(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: TenantRequest) {
    return this.usersUseCases.update(id, req.tenant.id, updateUserDto);
  }

  @Delete(':id')
  @RequirePermissions({ module: 'sistema', action: 'administrar' })
  remove(@Param('id') id: string, @Req() req: TenantRequest) {
    return this.usersUseCases.remove(id, req.tenant.id);
  }
}