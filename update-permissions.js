const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  console.log('🚀 Iniciando atualização total de permissões para Administradores...');
  
  const adminRole = await prisma.role.findFirst({ 
    where: { 
      OR: [
        { nome: 'ADMIN' },
        { nome: 'MASTER' },
        { nome: 'Administrador' }
      ]
    } 
  });

  if (!adminRole) {
    console.error('❌ ERRO: Nenhuma role administrativa encontrada.');
    return;
  }
  
  const superPermissions = {
    pacientes: { criar: true, editar: true, visualizar: true, excluir: true },
    agendamento: { criar: true, editar: true, visualizar: true, excluir: true, cancelar: true },
    prontuario: { criar: true, editar: true, visualizar: true, excluir: true },
    prescricao: { criar: true, editar: true, visualizar: true, excluir: true },
    medicacao: { criar: true, editar: true, visualizar: true, excluir: true, administrar: true },
    exames: { solicitar: true, liberar: true, visualizar: true, criar: true, editar: true, excluir: true },
    internacao: { admitir: true, alta: true, visualizar: true, criar: true, editar: true, excluir: true }, // Essencial para recursos cirúrgicos
    medicos: { criar: true, editar: true, visualizar: true, excluir: true },
    enfermeiros: { criar: true, editar: true, visualizar: true, excluir: true },
    usuarios: { criar: true, editar: true, visualizar: true, excluir: true },
    sistema: { administrar: true }
  };

  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissoes: superPermissions }
  });

  console.log(`✅ Role "${adminRole.nome}" atualizada com sucesso!`);
}

update().catch(console.error).finally(() => prisma.$disconnect());