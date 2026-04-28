const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.user.update({
    where: { id: "120874b1-0c38-47c7-9dfd-c500f5f541df" }, // ID que veio no seu JSON
    data: { 
      mustChangePassword: false,
      isActive: true 
    }
  });
  console.log('✅ Trava de senha removida! Tente logar agora.');
}
fix();