import { PrismaClient, Gender } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// 🔥 Função idêntica à do seu EncryptionService para garantir que a tela não quebre
function encryptData(text: string): string {
  if (!text) return text;
  // Como o ts-node puro não carrega o .env automaticamente, usamos a chave padrão do seu sistema
  const secret = process.env.ENCRYPTION_KEY || 'chave_mestra_super_segura_de_32_caracteres';
  const key = crypto.scryptSync(secret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

async function main() {
  console.log('🌱 Iniciando a geração automática e genérica de pacientes...');

  // 1. Busca TODOS os hospitais (Tenants) dinamicamente do banco de dados
  const tenants = await prisma.tenant.findMany({
    where: { isActive: true }
  });

  if (tenants.length === 0) {
    console.log('❌ Nenhum hospital encontrado. Crie um hospital primeiro.');
    return;
  }

  console.log(`🏥 Encontrados ${tenants.length} hospitais ativos. Preparando inserção...`);

  for (const tenant of tenants) {
    console.log(`\n👨‍⚕️ Injetando 10 pacientes testes no hospital: ${tenant.name}...`);

    for (let i = 1; i <= 10; i++) {
      // Gera um CPF único baseado no timestamp para evitar conflitos (Unique Constraint)
      const uniqueSuffix = Date.now().toString().slice(-5) + i.toString().padStart(2, '0');
      const cpfBruto = `999${uniqueSuffix}`; // Garante 11 dígitos numéricos
      
      const cpfCriptografado = encryptData(cpfBruto);
      const cpfHash = cpfBruto; // O sistema usa o bruto como hash em ambiente de dev/teste

      // 2. Cria o Paciente
      const patient = await prisma.patient.upsert({
        where: { cpfHash_tenantId: { cpfHash: cpfHash, tenantId: tenant.id } },
        update: {},
        create: {
          tenantId: tenant.id,
          nomeCompleto: `Paciente Genérico ${i} - ${tenant.name}`,
          cpf: cpfCriptografado,
          cpfHash: cpfHash,
          dataNascimento: new Date(1950 + Math.floor(Math.random() * 50), i % 12, (i % 28) + 1),
          sexo: i % 2 === 0 ? Gender.MASCULINO : Gender.FEMININO,
          telefone: '11988887777',
          status: 'ATIVO',
        },
      });

      // 3. Cria o Prontuário Médico Vinculado
      const recordNumber = `PEP-${tenant.subdomain.substring(0, 3).toUpperCase()}-${uniqueSuffix}`;
      
      await prisma.medicalRecord.upsert({
        where: { numero_tenantId: { numero: recordNumber, tenantId: tenant.id } },
        update: {},
        create: { 
          tenantId: tenant.id, 
          patientId: patient.id, 
          numero: recordNumber,
          status: 'ABERTO' 
        },
      });
    }
    
    console.log(`✅ 10 pacientes + prontuários gerados com sucesso para o ${tenant.name}.`);
  }

  console.log('\n🎉 Script finalizado com sucesso! Pode conferir as listagens no Frontend.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });