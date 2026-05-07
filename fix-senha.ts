import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@pep.com';
  const novaSenha = 'Admin@2024!';
  
  console.log(`🔍 Buscando contas com o email: ${email}`);
  const users = await prisma.user.findMany({ where: { email } });
  
  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado! O banco de dados está vazio.');
    return;
  }

  console.log(`⚙️ Encontradas ${users.length} contas (Tenants). Atualizando senhas...`);
  
  // Gera o Hash compatível com o bcryptjs
  const hash = await bcrypt.hash(novaSenha, 10);

  // Injeta o novo Hash diretamente no banco de dados e garante que o usuário está ativo
  await prisma.user.updateMany({
    where: { email },
    data: { 
        password: hash, 
        isActive: true, 
        deletedAt: null 
    }
  });

  console.log('✅ Senhas atualizadas com SUCESSO DIRETAMENTE NO BANCO DE DADOS!');
  
  // TESTE REAL: Vamos ler a senha que acabou de ser salva e simular o Login
  const userTest = await prisma.user.findFirst({ where: { email } });
  const isValid = await bcrypt.compare(novaSenha, userTest!.password);
  
  console.log('--------------------------------------------------');
  console.log(`Simulação de Login (bcrypt.compare): ${isValid ? 'PASSOU (Login Liberado) 🔓' : 'FALHOU 🔒'}`);
  console.log('--------------------------------------------------');
}

main().finally(() => prisma.$disconnect());