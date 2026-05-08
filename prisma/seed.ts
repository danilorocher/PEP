import { PrismaClient, PlanType, UserRole, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed de Testes do PEP+...');

  // 1. Definição de Senhas e Credenciais Master
  const standardPassword = '12345678';
  const passwordHash = await bcrypt.hash(standardPassword, 10);
  
  const adminEmail = 'admin@pep.com';
  const adminPasswordHash = await bcrypt.hash('Admin@2024!', 10);

  // 🔥 2. Criar CIDs de Teste (Agora no lugar correto, dentro do async main!)
  console.log('🩺 Criando CIDs de teste...');
  await prisma.cid10.upsert({
    where: { codigo: 'Z000' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      codigo: 'Z000',
      descricao: 'Exame médico geral',
      descricaoAbreviada: 'Exame geral'
    }
  });

  await prisma.cid10.upsert({
    where: { codigo: 'J00' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      codigo: 'J00',
      descricao: 'Nasofaringite aguda (resfriado comum)',
      descricaoAbreviada: 'Resfriado comum'
    }
  });

  const hospitais = [
    { name: 'Hospital Santa Maria', subdomain: 'santamaria', prefix: 'sm' },
    { name: 'Hospital São Lucas', subdomain: 'saolucas', prefix: 'sl' },
  ];

  for (const hosp of hospitais) {
    console.log(`\n🏥 Configurando: ${hosp.name}...`);

    // 3. Criar ou Atualizar o Tenant (Hospital)
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

    // 4. Criar a Role ADMIN (Permissão Total)
    const roleAdmin = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'ADMIN', tenantId: tenant.id } },
      update: { permissoes: JSON.stringify({ "*": { "*": true } }) },
      create: { 
        id: crypto.randomUUID(), 
        nome: 'ADMIN', 
        tenantId: tenant.id, 
        permissoes: JSON.stringify({ "*": { "*": true } }) 
      },
    });

    // 5. Criar o Usuário Administrador Master
    if (hosp.prefix === 'sm') {
      console.log(`  👑 Criando Administrador Master: ${adminEmail}`);
      await prisma.user.upsert({
        where: { email_tenantId: { email: adminEmail, tenantId: tenant.id } },
        update: { password: adminPasswordHash, isActive: true, roleId: roleAdmin.id },
        create: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          roleId: roleAdmin.id,
          roleName: UserRole.ADMIN,
          nomeCompleto: 'Administrador Master',
          email: adminEmail,
          cpf: '00000000000',
          cpfHash: '00000000000',
          password: adminPasswordHash,
          isActive: true
        },
      });
    }

    // 6. Criar Cargos (Occupations) Dinâmicos
    console.log(`  💼 Criando cargos para ${hosp.name}...`);
    let cargoMedico = await prisma.occupation.findFirst({
      where: { tenantId: tenant.id, nome: 'Médico Plantonista' }
    });

    if (!cargoMedico) {
      cargoMedico = await prisma.occupation.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          nome: 'Médico Plantonista',
          tipoBase: 'MEDICO',
          codigoCBO: '2251-25'
        }
      });
    }

    // 7. Criar Especialidades (Multi-tenant)
    console.log(`  🩺 Criando especialidades para ${hosp.name}...`);
    const especialidades = ['Clínica Médica', 'Cardiologia', 'Pediatria'];
    for (const spec of especialidades) {
      await prisma.specialty.upsert({
        where: { nome_tenantId: { nome: spec, tenantId: tenant.id } },
        update: {},
        create: { 
          id: crypto.randomUUID(), 
          nome: spec, 
          tenantId: tenant.id 
        }
      });
    }

    // 8. Configurar Role Médico e Usuário Médico
    const roleMedico = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'MEDICO', tenantId: tenant.id } },
      update: {},
      create: { 
        id: crypto.randomUUID(), 
        nome: 'MEDICO', 
        tenantId: tenant.id, 
        permissoes: JSON.stringify({ "pacientes": {"*": true}, "prontuario": {"*": true} }) 
      },
    });

    const medicoEmail = `medico@${hosp.subdomain}.com`;
    const medicoUser = await prisma.user.upsert({
      where: { email_tenantId: { email: medicoEmail, tenantId: tenant.id } },
      update: { occupationId: cargoMedico.id },
      create: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        roleId: roleMedico.id,
        roleName: UserRole.MEDICO,
        nomeCompleto: `Dr. Teste ${hosp.name}`,
        email: medicoEmail,
        cpf: `2222222222${hosp.prefix === 'sm' ? '1' : '2'}`,
        cpfHash: `2222222222${hosp.prefix === 'sm' ? '1' : '2'}`,
        password: passwordHash,
        isActive: true,
        occupationId: cargoMedico.id
      }
    });

    await prisma.doctor.upsert({
      where: { crm_ufCrm_tenantId: { crm: `12345${hosp.prefix === 'sm' ? '1' : '2'}`, ufCrm: 'SP', tenantId: tenant.id } },
      update: { occupationId: cargoMedico.id },
      create: {
        id: crypto.randomUUID(),
        tenantId: tenant.id,
        userId: medicoUser.id,
        nomeCompleto: medicoUser.nomeCompleto,
        cpf: medicoUser.cpf,
        cpfHash: medicoUser.cpf,
        crm: `12345${hosp.prefix === 'sm' ? '1' : '2'}`,
        ufCrm: 'SP',
        status: 'ATIVO',
        occupationId: cargoMedico.id
      }
    });

    // 9. Criar Pacientes
    for (let i = 1; i <= 3; i++) {
      const cpfP = `${hosp.prefix}11122233${i}`;
      await prisma.patient.upsert({
        where: { cpfHash_tenantId: { cpfHash: cpfP, tenantId: tenant.id } },
        update: {},
        create: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          nomeCompleto: `Paciente ${i} (${hosp.name})`,
          cpf: cpfP,
          cpfHash: cpfP,
          dataNascimento: new Date(1990, 5, i),
          sexo: Gender.MASCULINO,
          status: 'ATIVO'
        }
      });
    }
  }

  console.log('\n✅ Seed finalizado com sucesso!');
  console.log(`🚀 Acesse com: ${adminEmail} / Senha: Admin@2024!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });