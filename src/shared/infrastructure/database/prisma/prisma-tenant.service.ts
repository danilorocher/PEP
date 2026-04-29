import { PrismaClient } from '@prisma/client';

// Lista de models do seu schema que são GLOBAIS (NÃO possuem tenantId)
const globalModels = ['Tenant', 'Cid10', 'Specialty'];

export function getTenantPrisma(prisma: PrismaClient, tenantId: string) {
  // Criamos uma extensão em tempo de execução
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Se for um modelo global, passa a query direto
          if (model && globalModels.includes(model as string)) {
            return query(args);
          }

          // 2. Garante o tenantId nas operações de LEITURA, ATUALIZAÇÃO e EXCLUSÃO
          // Usamos (args as any) para o TypeScript não reclamar da tipagem rigorosa do Prisma
          if (['findUnique', 'findFirst', 'findMany', 'count', 'update', 'updateMany', 'delete', 'deleteMany'].includes(operation)) {
            (args as any).where = { ...(args as any).where, tenantId };
          }
          
          // 3. Garante o tenantId nas operações de CRIAÇÃO
          if (['create', 'createMany'].includes(operation)) {
            if (Array.isArray((args as any).data)) {
              (args as any).data = (args as any).data.map((item: any) => ({ ...item, tenantId }));
            } else {
              (args as any).data = { ...(args as any).data, tenantId };
            }
          }

          return query(args);
        },
      },
    },
  });
}

// Tipo exportado para usarmos nos Services
export type TenantPrismaClient = ReturnType<typeof getTenantPrisma>;