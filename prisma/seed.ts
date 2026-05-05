import { PrismaClient, PlanType, UserRole, Gender, PharmaForm, AdminRoute, WardType, BedType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed de Testes do PEP+...');

  // Senha padrão para todos os usuários: 123456
  const passwordHash = await bcrypt.hash('123456', 10);
  
  // 🔥 DADOS DO ADMIN MASTER (Comum a todos os hospitais)
  const masterAdminEmail = 'admin@pep.com';
  const masterAdminCpf = '00000000000'; // Mesmo CPF para unificar a identidade física

  const hospitais = [
    { name: 'Hospital Santa Maria', subdomain: 'santamaria', prefix: 'sm' },
    { name: 'Hospital São Lucas', subdomain: 'saolucas', prefix: 'sl' },
  ];

  for (const hosp of hospitais) {
    console.log(`\n🏥 Configurando: ${hosp.name}...`);

    // 1. Criar o Tenant (Hospital)
    const tenant = await prisma.tenant.upsert({
      where: { subdomain: hosp.subdomain },
      update: {},
      create: {
        name: hosp.name,
        subdomain: hosp.subdomain,
        plano: PlanType.ENTERPRISE,
        cnpj: `00.000.000/000${hosp.prefix === 'sm' ? '1' : '2'}-00`,
      },
    });

    // 2. Criar Roles (Perfis de Acesso Básicos)
    const permissoesAdmin = JSON.stringify({ "sistema": { "administrar": true } });
    const roleAdmin = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'ADMIN', tenantId: tenant.id } },
      update: {},
      create: { nome: 'ADMIN', tenantId: tenant.id, permissoes: permissoesAdmin },
    });

    const roleMedico = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'MEDICO', tenantId: tenant.id } },
      update: {},
      create: { nome: 'MEDICO', tenantId: tenant.id, permissoes: JSON.stringify({ "prontuario": { "criar": true, "visualizar": true } }) },
    });

    const roleRecepcao = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'RECEPCAO', tenantId: tenant.id } },
      update: {},
      create: { nome: 'RECEPCAO', tenantId: tenant.id, permissoes: JSON.stringify({ "pacientes": { "criar": true, "visualizar": true } }) },
    });

    // 3. Criar Usuários Funcionários
    // 3.1 Administrador MASTER (Sempre o mesmo e-mail e CPF)
    await prisma.user.upsert({
      where: { email_tenantId: { email: masterAdminEmail, tenantId: tenant.id } },
      update: {},
      create: {
        tenantId: tenant.id, 
        roleId: roleAdmin.id, 
        roleName: UserRole.ADMIN,
        nomeCompleto: `Administrador Master`, 
        email: masterAdminEmail,
        cpf: masterAdminCpf, 
        cpfHash: masterAdminCpf, // Usando o CPF bruto como Hash para testes
        password: passwordHash,
      },
    });

    // 3.2 Recepcionista
    await prisma.user.upsert({
      where: { email_tenantId: { email: `recepcao@${hosp.subdomain}.com`, tenantId: tenant.id } },
      update: {},
      create: {
        tenantId: tenant.id, roleId: roleRecepcao.id, roleName: UserRole.RECEPCIONISTA,
        nomeCompleto: `Recepção ${hosp.name}`, email: `recepcao@${hosp.subdomain}.com`,
        cpf: `1111111111${hosp.prefix === 'sm' ? '1' : '2'}`, password: passwordHash,
      },
    });

    // 3.3 Médico
    const medicoUser = await prisma.user.upsert({
      where: { email_tenantId: { email: `medico@${hosp.subdomain}.com`, tenantId: tenant.id } },
      update: {},
      create: {
        tenantId: tenant.id, roleId: roleMedico.id, roleName: UserRole.MEDICO,
        nomeCompleto: `Dr. Teste ${hosp.name}`, email: `medico@${hosp.subdomain}.com`,
        cpf: `2222222222${hosp.prefix === 'sm' ? '1' : '2'}`, password: passwordHash,
      },
    });

    // Criar o perfil de Doutor vinculado ao usuário para permitir agendamentos
    await prisma.doctor.upsert({
      where: { cpfHash_tenantId: { cpfHash: medicoUser.cpf, tenantId: tenant.id } },
      update: {},
      create: {
        tenantId: tenant.id, userId: medicoUser.id,
        nomeCompleto: medicoUser.nomeCompleto, cpf: medicoUser.cpf, cpfHash: medicoUser.cpf,
        crm: `12345${hosp.prefix === 'sm' ? '1' : '2'}`, ufCrm: 'SP',
      },
    });

    // 4. Criar Estrutura (Ala e Leitos) para Internação (🔥 Corrigido para não duplicar)
    let ward = await prisma.ward.findFirst({ where: { nome: 'Enfermaria Clínica', tenantId: tenant.id } });
    if (!ward) {
      ward = await prisma.ward.create({
        data: {
          tenantId: tenant.id, nome: 'Enfermaria Clínica', tipo: WardType.ENFERMARIA, capacidade: 5,
        },
      });
    }

    for (let i = 1; i <= 5; i++) {
      await prisma.bed.upsert({
        where: { numero_wardId_tenantId: { numero: `L-${i}`, wardId: ward.id, tenantId: tenant.id } },
        update: {},
        create: { tenantId: tenant.id, wardId: ward.id, numero: `L-${i}`, tipo: BedType.CLINICO },
      });
    }

    // 5. Criar 10 Pacientes Teste por Hospital
    console.log(`   👥 Criando 10 pacientes para o ${hosp.name}...`);
    for (let i = 1; i <= 10; i++) {
      const cpfPaciente = `999888777${i.toString().padStart(2, '0')}`;
      
      const patient = await prisma.patient.upsert({
        where: { cpfHash_tenantId: { cpfHash: cpfPaciente, tenantId: tenant.id } },
        update: {},
        create: {
          tenantId: tenant.id,
          nomeCompleto: `Paciente Teste ${i} (${hosp.name})`,
          cpf: cpfPaciente, cpfHash: cpfPaciente,
          dataNascimento: new Date(1990, 1, i),
          sexo: i % 2 === 0 ? Gender.MASCULINO : Gender.FEMININO,
          telefone: '11999999999'
        },
      });

      // Criar um Prontuário para cada paciente automaticamente
      await prisma.medicalRecord.upsert({
        where: { numero_tenantId: { numero: `PEP-${hosp.prefix}-${i}`, tenantId: tenant.id } },
        update: {},
        create: { tenantId: tenant.id, patientId: patient.id, numero: `PEP-${hosp.prefix}-${i}` },
      });
    }

    // 6. Criar Medicamentos no Catálogo e Estoque (Para Testes de Prescrição)
    const medicamentos = [
      { nome: 'Dipirona Sódica 500mg', principioAtivo: 'Dipirona', forma: PharmaForm.COMPRIMIDO, via: AdminRoute.ORAL },
      { nome: 'Ceftriaxona 1g', principioAtivo: 'Ceftriaxona', forma: PharmaForm.INJETAVEL, via: AdminRoute.INTRAVENOSA },
    ];

    for (const med of medicamentos) {
      let catalogMed = await prisma.medication.findFirst({ where: { nome: med.nome, tenantId: tenant.id } });
      
      if (!catalogMed) {
        catalogMed = await prisma.medication.create({
          data: {
            tenantId: tenant.id, nome: med.nome, principioAtivo: med.principioAtivo,
            formaFarmaceutica: med.forma, viaAdministracaoPadrao: med.via, status: 'ATIVO'
          }
        });
      }

      // Inserir 500 unidades no estoque
      await prisma.medicationStock.upsert({
        where: { medicationId_lote_localizacao_tenantId: { medicationId: catalogMed.id, lote: 'LOTE-TESTE-01', localizacao: 'Almoxarifado Central', tenantId: tenant.id } },
        update: {},
        create: {
          tenantId: tenant.id, medicationId: catalogMed.id, lote: 'LOTE-TESTE-01',
          quantidade: 500, validade: new Date(2030, 11, 31), localizacao: 'Almoxarifado Central'
        }
      });
    }
  }

  console.log('\n✅ Seed finalizado com sucesso!');
  console.log('--------------------------------------------------');
  console.log('Credenciais geradas para testes (A senha para TODOS é: 123456)');
  console.log('\n🏥 HOSPITAL SANTA MARIA (Subdomínio: santamaria)');
  console.log('   Admin:      admin@pep.com');
  console.log('   Recepção:   recepcao@santamaria.com');
  console.log('   Médico:     medico@santamaria.com');
  console.log('\n🏥 HOSPITAL SÃO LUCAS (Subdomínio: saolucas)');
  console.log('   Admin:      admin@pep.com');
  console.log('   Recepção:   recepcao@saolucas.com');
  console.log('   Médico:     medico@saolucas.com');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });