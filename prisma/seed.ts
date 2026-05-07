import { PrismaClient, PlanType, UserRole, Gender, PharmaForm, AdminRoute, WardType, BedType } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs'; // 🔥 Importação única e correta

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed de Testes do PEP+...');

  // Senha padrão para usuários comuns
  const passwordHash = await bcrypt.hash('123456', 10);
  
  // DADOS DO ADMIN MASTER
  const masterAdminEmail = 'admin@pep.com';
  const masterAdminPassword = 'Admin@2024!'; // 🔥 Confirme se está digitando esta senha
  const masterAdminPasswordHash = await bcrypt.hash(masterAdminPassword, 10);
  const masterAdminCpf = '00000000000'; 

  const hospitais = [
    { name: 'Hospital Santa Maria', subdomain: 'santamaria', prefix: 'sm' },
    { name: 'Hospital São Lucas', subdomain: 'saolucas', prefix: 'sl' },
  ];

  for (const hosp of hospitais) {
    console.log(`\n🏥 Configurando: ${hosp.name}...`);

    // 1. Criar o Tenant (Hospital)
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: hosp.subdomain },
      update: {},
      create: {
        id: crypto.randomUUID(),
        name: hosp.name,
        subdomain: hosp.subdomain,
        plano: PlanType.ENTERPRISE,
        cnpj: `00.000.000/000${hosp.prefix === 'sm' ? '1' : '2'}-00`,
      },
    });

    // 2. Criar Roles
    const roleAdmin = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'ADMIN', tenantId: tenant.id } },
      update: {},
      create: { id: crypto.randomUUID(), nome: 'ADMIN', tenantId: tenant.id, permissoes: { "sistema": { "administrar": true } } },
    });

    // 3. Criar Usuários
    // 3.1 Administrador MASTER
    await prisma.user.upsert({
      where: { email_tenantId: { email: masterAdminEmail, tenantId: tenant.id } },
      update: { 
        password: masterAdminPasswordHash, // 🔥 Força a atualização do hash para bcryptjs
        isActive: true,
        deletedAt: null
      }, 
      create: {
        id: crypto.randomUUID(),
        tenantId: tenant.id, 
        roleId: roleAdmin.id, 
        roleName: UserRole.ADMIN,
        nomeCompleto: 'Administrador Master', 
        email: masterAdminEmail,
        cpf: masterAdminCpf, 
        cpfHash: masterAdminCpf, 
        password: masterAdminPasswordHash,
        isActive: true
      },
    });

    // ... (restante do seu código de pacientes e medicamentos pode continuar aqui igual ao anterior)
    console.log(`   ✅ Hospital ${hosp.name} configurado.`);
  }

  console.log('\n✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });