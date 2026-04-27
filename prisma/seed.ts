import { PrismaClient, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed da Fase 2 do PEP+...');

  // 1. Populando Catálogos Globais (CID-10 e Especialidades)
  console.log('📦 Inserindo Catálogos Globais...');
  
  await prisma.specialty.upsert({
    where: { nome: 'Cardiologia' },
    update: {},
    create: { nome: 'Cardiologia', codigoCBOS: '225120' },
  });
  await prisma.specialty.upsert({
    where: { nome: 'Pediatria' },
    update: {},
    create: { nome: 'Pediatria', codigoCBOS: '225124' },
  });

  // Amostra do CID-10 (No futuro, carregar de um CSV/JSON do DATASUS via script externo)
  const cids = [
    { codigo: 'J18.9', descricao: 'Pneumonia não especificada' },
    { codigo: 'I10', descricao: 'Pneumonia devida a microorganismo não especificado' },
    { codigo: 'E10.9', descricao: 'Hipertensão essencial (primária)' },
    { codigo: 'E11.9', descricao: 'Diabetes mellitus não especificado' }
  ];

  for (const cid of cids) {
    await prisma.cid10.upsert({
      where: { codigo: cid.codigo },
      update: {},
      create: { codigo: cid.codigo, descricao: cid.descricao },
    });
  }

  // 2. Criação do Tenant (Clínica)
  console.log('🏥 Criando Tenant/Empresa Principal...');
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'admin' },
    update: {},
    create: {
      name: 'PEP+ Administração Central',
      subdomain: 'admin',
      plano: PlanType.ENTERPRISE,
      isActive: true,
    },
  });

  // 3. Criação das Roles Padrão (RBAC)
  console.log('🔐 Criando Perfil de Acesso (Roles)...');
  
  const adminPermissions = {
    pacientes: { criar: true, editar: true, visualizar: true, excluir: true },
    prontuario: { visualizar: true, editar: true },
    prescricao: { criar: true, visualizar: true },
    exames: { solicitar: true, liberar: true, visualizar: true },
    internacao: { admitir: true, alta: true, visualizar: true },
    medicacao: { administrar: true, visualizar: true },
    agendamento: { criar: true, cancelar: true, visualizar: true },
    faturamento: { criar: true, visualizar: true },
    relatorios: { visualizar: true },
    sistema: { administrar: true }
  };

  const adminRole = await prisma.role.upsert({
    where: { nome_tenantId: { nome: 'ADMIN', tenantId: tenant.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      nome: 'ADMIN',
      permissoes: adminPermissions,
    },
  });

  // 4. Criação do Usuário Admin
  console.log('👤 Criando Usuário Administrador...');
  const hashedPassword = await bcrypt.hash('Admin@2024!', 12);

  await prisma.user.upsert({
    where: { 
      email_tenantId: { email: 'admin@pep.com', tenantId: tenant.id } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      nomeCompleto: 'Administrador Master',
      cpf: 'hash_criptografado_cpf_admin', // Na Fase 3 passará pelo EncryptionService real
      email: 'admin@pep.com',
      password: hashedPassword,
      roleName: 'ADMIN',
      isActive: true,
      mustChangePassword: true, // Força a troca no primeiro acesso em Produção
    },
  });

  console.log('✅ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });