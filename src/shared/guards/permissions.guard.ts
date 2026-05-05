import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';
import { PrismaService } from '../infrastructure/database/prisma/repositories/prisma.service';
import { TenantRequest } from '../../common/middlewares/tenant.middleware';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = (request as any).user;
    
    // 🔥 BYPASS MASTER ADMIN: Se for o e-mail master, libera TUDO imediatamente sem olhar o banco
    if (user && user.email === 'admin@pep.com') {
      return true;
    }

    const tenantId = request.tenant?.id;

    if (!user || !tenantId) {
      throw new ForbiddenException('Acesso negado: Usuário ou Tenant não identificado.');
    }

    // Busca as permissões em tempo real para evitar tokens desatualizados se o admin mudar as regras
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub, tenantId },
      include: { role: true },
    });

    if (!userRecord || !userRecord.isActive || !userRecord.role) {
      throw new ForbiddenException('Acesso negado: Usuário inativo ou sem perfil associado.');
    }

    const userPermissions = userRecord.role.permissoes as Record<string, Record<string, boolean>>;

    // Verifica se o usuário tem TODAS as permissões exigidas pela rota
    const hasAllPermissions = requiredPermissions.every((reqPerm) => {
      const modulePermissions = userPermissions[reqPerm.module];
      if (!modulePermissions) return false;
      return modulePermissions[reqPerm.action] === true;
    });

    if (!hasAllPermissions) {
      throw new ForbiddenException('Acesso negado: Você não tem permissão para realizar esta ação.');
    }

    return true;
  }
}