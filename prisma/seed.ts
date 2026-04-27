import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed do PEP+...');

  // 1. Cria a Clínica Principal (Tenant de Administração)
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'admin' },
    update: {},
    create: {
      name: 'PEP+ Administração Central',
      subdomain: 'admin',
      isActive: true,
    },
  });

  // 2. Cria o Usuário Admin Master
  const hashedPassword = await bcrypt.hash('Admin@2024!', 12);

  await prisma.user.upsert({
    where: { 
      email_tenantId: { email: 'admin@pep.com', tenantId: tenant.id } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@pep.com',
      password: hashedPassword,
      name: 'Administrador Master',
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log('✅ Seed finalizado com sucesso. Usuário admin@pep.com criado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });