import { PrismaClient } from '@prisma/client';
// 🔥 BYPASS: Usamos o require nativo para ignorar a frescura do TypeScript com os @types
const bcrypt = require('bcryptjs'); 

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@pep.com';
  const novaSenha = 'Admin@2024!';
  
  console.log(`🔍 Buscando conta com o email: ${email}`);
  const users = await prisma.user.findMany({ where: { email } });
  
  if (users.length === 0) {
    console.log('❌ Nenhum usuário encontrado! Rode o "npx prisma db seed" primeiro.');
    return;
  }

  // Se houver duplicados, ele vai pegar todos e unificar com a mesma senha e permissão
  console.log(`⚙️ Encontrada(s) ${users.length} conta(s). Atualizando a senha para o padrão seguro...`);
  
  // Gera o Hash compatível com o bcryptjs
  const hash = await bcrypt.hash(novaSenha, 10);

  // Injeta o novo Hash no banco e garante que a conta está perfeitamente ativa
  await prisma.user.updateMany({
    where: { email },
    data: { 
        password: hash, 
        isActive: true, 
        deletedAt: null,
        mustChangePassword: false,
        roleName: 'ADMIN'
    }
  });

  console.log('✅ Senha atualizada com SUCESSO DIRETAMENTE NO BANCO DE DADOS!');
  
  // TESTE REAL: Vamos ler a senha que acabou de ser salva e simular o Login
  const userTest = await prisma.user.findFirst({ where: { email } });
  
  if (userTest) {
      const isValid = await bcrypt.compare(novaSenha, userTest.password);
      
      console.log('--------------------------------------------------');
      console.log(`Simulação de Login: ${isValid ? 'PASSOU (Login Liberado) 🔓' : 'FALHOU 🔒'}`);
      console.log('--------------------------------------------------');
  }
}

main()
  .catch((e) => {
    console.error('Erro ao executar o script:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });