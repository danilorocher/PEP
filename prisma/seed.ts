import { PrismaClient, PlanType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

// 1. Captura a URL do banco a partir do .env
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL não encontrada no arquivo .env');
}

// 2. Configura o pool de conexão e o adaptador oficial do Prisma 7
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Inicializa o Prisma Client com o adaptador
const prisma = new PrismaClient({ adapter });

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
  console.log('🌱 Iniciando Seed Corrigido do PEP+...');

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

  // Tenta buscar o arquivo completo de CID-10 do DATASUS. Caso não ache, insere a amostra corrigida.
  const cidFilePath = path.join(__dirname, 'cid10.json');
  if (fs.existsSync(cidFilePath)) {
    console.log('📄 Arquivo cid10.json encontrado! Carregando a base oficial...');
    const rawData = fs.readFileSync(cidFilePath, 'utf-8');
    const cidData = JSON.parse(rawData);
    
    // Insere os 13 mil registros ignorando duplicados
    await prisma.cid10.createMany({
      data: cidData,
      skipDuplicates: true,
    });
    console.log(`✅ Base Oficial do CID-10 carregada com sucesso!`);
  } else {
    console.log('⚠️ Arquivo cid10.json não encontrado na pasta prisma/. Carregando amostra básica.');
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

  // 4. Criação do Usuário Admin com Criptografia Real
  console.log('👤 Criando Usuário Administrador (criptografado)...');
  
  const hashedPassword = await bcrypt.hash('Admin@2024!', 12);
  const cpfCriptografado = encryptSensitiveData('00000000000');

  await prisma.user.upsert({
    where: { 
      email_tenantId: { email: 'admin@pep.com', tenantId: tenant.id } 
    },
    update: {},
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

  console.log('✅ Seed 100% finalizado e seguro com criptografia!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // Opcional: fechar o pool do pg para não deixar processos pendentes
    await pool.end();
  });