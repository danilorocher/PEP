import { PrismaClient, PlanType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// 1. Inicializa o Prisma Client limpo
const prisma = new PrismaClient();

// Função auxiliar para simular o EncryptionService isoladamente no Seed
function encryptSensitiveData(text: string): string {
  if (!text) return text;
  
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error('A variável ENCRYPTION_KEY precisa existir no .env e ter no mínimo 32 caracteres.');
  }
  
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function main() {
  console.log('🌱 Iniciando Seed Definitivo do PEP+...');

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

  const cidFilePath = path.join(__dirname, 'cid10.json');
  if (fs.existsSync(cidFilePath)) {
    console.log('📄 Arquivo cid10.json encontrado! Carregando a base oficial...');
    const rawData = fs.readFileSync(cidFilePath, 'utf-8');
    const cidData = JSON.parse(rawData);
    
    await prisma.cid10.createMany({
      data: cidData,
      skipDuplicates: true,
    });
    console.log(`✅ Base Oficial do CID-10 carregada com sucesso!`);
  } else {
    console.log('⚠️ Arquivo cid10.json não encontrado. Carregando amostra básica.');
    const cids = [
      { codigo: 'J18.9', descricao: 'Pneumonia não especificada' },
      { codigo: 'I10', descricao: 'Hipertensão essencial (primária)' },
      { codigo: 'E10.9', descricao: 'Diabetes mellitus insulinodependente - sem complicações' },
      { codigo: 'E11.9', descricao: 'Diabetes mellitus não-insulinodependente - sem complicações' }
    ];

    for (const cid of cids) {
      await prisma.cid10.upsert({
        where: { codigo: cid.codigo },
        update: {},
        create: { codigo: cid.codigo, descricao: cid.descricao },
      });
    }
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

  // 3. Criação das Roles Padrão (RBAC) - SUPER ADMIN COMPLETO
  console.log('🔐 Configurando Perfil de Acesso ADMIN com poderes totais...');
  
  const adminPermissions = {
    // Cadastros e Gestão de Pacientes
    pacientes: { criar: true, editar: true, visualizar: true, excluir: true },
    agendamento: { criar: true, editar: true, visualizar: true, excluir: true, cancelar: true },
    
    // Área Clínica
    prontuario: { criar: true, editar: true, visualizar: true, excluir: true },
    prescricao: { criar: true, editar: true, visualizar: true, excluir: true },
    medicacao: { criar: true, editar: true, visualizar: true, excluir: true, administrar: true },
    exames: { criar: true, editar: true, visualizar: true, excluir: true, solicitar: true, liberar: true },
    
    // Estrutura Hospitalar e Internação
    internacao: { admitir: true, alta: true, visualizar: true, criar: true, editar: true, excluir: true },
    alas: { criar: true, editar: true, visualizar: true, excluir: true },
    wards: { criar: true, editar: true, visualizar: true, excluir: true },
    leitos: { criar: true, editar: true, visualizar: true, excluir: true },
    beds: { criar: true, editar: true, visualizar: true, excluir: true },
    estrutura: { administrar: true, criar: true, editar: true, visualizar: true, excluir: true },
    
    // Gestão Administrativa e RH
    usuarios: { criar: true, editar: true, visualizar: true, excluir: true },
    medicos: { criar: true, editar: true, visualizar: true, excluir: true },
    enfermeiros: { criar: true, editar: true, visualizar: true, excluir: true },
    especialidades: { criar: true, editar: true, visualizar: true, excluir: true },
    roles: { criar: true, editar: true, visualizar: true, excluir: true },
    
    // Faturamento e Auditoria
    faturamento: { criar: true, editar: true, visualizar: true, excluir: true },
    relatorios: { visualizar: true, exportar: true },
    
    // Configurações de Sistema
    sistema: { administrar: true }
  };

  const adminRole = await prisma.role.upsert({
    where: { nome_tenantId: { nome: 'ADMIN', tenantId: tenant.id } },
    update: {
      permissoes: adminPermissions, // Atualiza as permissões se a Role já existir
    },
    create: {
      tenantId: tenant.id,
      nome: 'ADMIN',
      permissoes: adminPermissions,
    },
  });

  // 4. Criação do Usuário Admin
  console.log('👤 Criando Usuário Administrador...');
  
  const hashedPassword = await bcrypt.hash('Admin@2024!', 12);
  const cpfCriptografado = encryptSensitiveData('00000000000');

  await prisma.user.upsert({
    where: { 
      email_tenantId: { email: 'admin@pep.com', tenantId: tenant.id } 
    },
    update: {
      roleId: adminRole.id,
      roleName: 'ADMIN'
    },
    create: {
      tenantId: tenant.id,
      roleId: adminRole.id,
      nomeCompleto: 'Administrador Master',
      cpf: cpfCriptografado, 
      email: 'admin@pep.com',
      password: hashedPassword,
      roleName: 'ADMIN',
      isActive: true,
      mustChangePassword: true,
    },
  });

  console.log('✅ Seed 100% finalizado com permissões definitivas!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });