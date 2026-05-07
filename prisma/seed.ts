import { PrismaClient, PlanType, UserRole, Gender, PharmaForm, AdminRoute, WardType, BedType } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o Seed de Testes do PEP+...');

  const passwordHash = await bcrypt.hash('12345678', 10);
  
  const masterAdminEmail = 'admin@pep.com';
  const masterAdminPasswordHash = await bcrypt.hash('Admin@2024!', 10);
  const masterAdminCpf = '00000000000'; 

  const hospitais = [
    { name: 'Hospital Santa Maria', subdomain: 'santamaria', prefix: 'sm' },
    { name: 'Hospital São Lucas', subdomain: 'saolucas', prefix: 'sl' },
  ];

  for (const hosp of hospitais) {
    console.log(`\n🏥 Configurando: ${hosp.name}...`);

    // 1. Criar Hospital
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

    // ... dentro do loop de hospitais ...

    // 2. Criar Perfis de Acesso (Roles)
    // 🔥 ADMIN GOOD MODE: Permissão total garantida
    const permissoesAdmin = JSON.stringify({ "*": { "*": true } });
    const roleAdmin = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'ADMIN', tenantId: tenant.id } },
      update: { permissoes: permissoesAdmin }, 
      create: { id: crypto.randomUUID(), nome: 'ADMIN', tenantId: tenant.id, permissoes: permissoesAdmin },
    });

    // 🔥 MÉDICO COMPLETO: Adicionado o módulo "medicos" para ele poder ver a lista de profissionais
    const permissoesMedico = JSON.stringify({ 
      "pacientes": { "visualizar": true, "criar": true, "editar": true },
      "medicos": { "visualizar": true }, 
      "prontuario": { "visualizar": true, "criar": true, "editar": true },
      "prescricoes": { "visualizar": true, "criar": true, "editar": true },
      "agendamento": { "visualizar": true, "criar": true }
    });

    const roleMedico = await prisma.role.upsert({
      where: { nome_tenantId: { nome: 'MEDICO', tenantId: tenant.id } },
      update: { permissoes: permissoesMedico }, 
      create: { id: crypto.randomUUID(), nome: 'MEDICO', tenantId: tenant.id, permissoes: permissoesMedico },
    });

    // 3. Usuários
    await prisma.user.upsert({
      where: { email_tenantId: { email: masterAdminEmail, tenantId: tenant.id } },
      update: { password: masterAdminPasswordHash, isActive: true, deletedAt: null }, 
      create: {
        id: crypto.randomUUID(),
        tenantId: tenant.id, roleId: roleAdmin.id, roleName: UserRole.ADMIN,
        nomeCompleto: `Administrador Master`, email: masterAdminEmail,
        cpf: masterAdminCpf, cpfHash: masterAdminCpf, password: masterAdminPasswordHash,
        isActive: true
      },
    });

    // 3.4 O Médico (Para você testar as evoluções)
    const medicoUser = await prisma.user.upsert({
      where: { email_tenantId: { email: `medico@${hosp.subdomain}.com`, tenantId: tenant.id } },
      update: { password: passwordHash, isActive: true },
      create: {
        id: crypto.randomUUID(),
        tenantId: tenant.id, roleId: roleMedico.id, roleName: UserRole.MEDICO,
        nomeCompleto: `Dr. Teste ${hosp.name}`, email: `medico@${hosp.subdomain}.com`,
        cpf: `2222222222${hosp.prefix === 'sm' ? '1' : '2'}`, 
        cpfHash: `2222222222${hosp.prefix === 'sm' ? '1' : '2'}`, 
        password: passwordHash,
        isActive: true
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { crm_ufCrm_tenantId: { crm: `12345${hosp.prefix === 'sm' ? '1' : '2'}`, ufCrm: 'SP', tenantId: tenant.id } },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenantId: tenant.id, userId: medicoUser.id,
        nomeCompleto: medicoUser.nomeCompleto, 
        cpf: medicoUser.cpf, 
        cpfHash: medicoUser.cpf,
        crm: `12345${hosp.prefix === 'sm' ? '1' : '2'}`, ufCrm: 'SP', status: 'ATIVO'
      },
    });

    // ... (restante das especialidades, leitos, pacientes e medicamentos continua igual ao seu)
    // [Mantive a lógica original do seu loop para pacientes e medicamentos aqui para brevidade]
    
    const specs = ['Clínica Médica', 'Cardiologia', 'Pediatria'];
    for (const spec of specs) {
      await prisma.specialty.upsert({
        where: { nome: spec },
        update: {},
        create: { id: crypto.randomUUID(), nome: spec }
      });
    }
    const clinicaSpec = await prisma.specialty.findUnique({ where: { nome: 'Clínica Médica' } });
    if (clinicaSpec) {
      const docSpecExists = await prisma.doctorSpecialty.findUnique({
          where: { doctorId_specialtyId: { doctorId: doctor.id, specialtyId: clinicaSpec.id } }
      });
      if (!docSpecExists) {
          await prisma.doctorSpecialty.create({ data: { doctorId: doctor.id, specialtyId: clinicaSpec.id } });
      }
    }

    let ward = await prisma.ward.findFirst({ where: { nome: 'Enfermaria Clínica', tenantId: tenant.id } });
    if (!ward) {
      ward = await prisma.ward.create({
        data: {
          id: crypto.randomUUID(),
          tenantId: tenant.id, nome: 'Enfermaria Clínica', tipo: WardType.ENFERMARIA, capacidade: 5, status: 'ATIVO'
        },
      });
    }
    for (let i = 1; i <= 5; i++) {
      await prisma.bed.upsert({
        where: { numero_wardId_tenantId: { numero: `L-${i}`, wardId: ward.id, tenantId: tenant.id } },
        update: {},
        create: { id: crypto.randomUUID(), tenantId: tenant.id, wardId: ward.id, numero: `L-${i}`, tipo: BedType.CLINICO, status: 'LIVRE' },
      });
    }
    for (let i = 1; i <= 10; i++) {
      const cpfPaciente = `999888777${i.toString().padStart(2, '0')}`;
      const patient = await prisma.patient.upsert({
        where: { cpfHash_tenantId: { cpfHash: cpfPaciente, tenantId: tenant.id } },
        update: {},
        create: {
          id: crypto.randomUUID(),
          tenantId: tenant.id,
          nomeCompleto: `Paciente Teste ${i} (${hosp.name})`,
          cpf: cpfPaciente, cpfHash: cpfPaciente,
          dataNascimento: new Date(1990, 1, i),
          sexo: i % 2 === 0 ? Gender.MASCULINO : Gender.FEMININO,
          telefone: '11999999999',
          status: 'ATIVO'
        },
      });
      await prisma.medicalRecord.upsert({
        where: { numero_tenantId: { numero: `PEP-${hosp.prefix}-${i}`, tenantId: tenant.id } },
        update: {},
        create: { id: crypto.randomUUID(), tenantId: tenant.id, patientId: patient.id, numero: `PEP-${hosp.prefix}-${i}`, status: 'ABERTO' },
      });
    }
  }

  console.log('\n✅ Seed finalizado com sucesso!');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });