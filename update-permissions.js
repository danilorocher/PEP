const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  const adminRole = await prisma.role.findFirst({ where: { nome: 'ADMIN' } });
  
  const superPermissions = {
    pacientes: { criar: true, editar: true, visualizar: true, excluir: true },
    usuarios: { criar: true, editar: true, visualizar: true, excluir: true },
    medicos: { criar: true, editar: true, visualizar: true, excluir: true },
    enfermeiros: { criar: true, editar: true, visualizar: true, excluir: true },
    especialidades: { criar: true, editar: true, visualizar: true, excluir: true },
    exames: { solicitar: true, liberar: true, visualizar: true, criar: true },
    agendamento: { criar: true, cancelar: true, visualizar: true },
    sistema: { administrar: true }
  };

  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissoes: superPermissions }
  });

  console.log('🚀 Permissões de administrador atualizadas com sucesso!');
}
update();