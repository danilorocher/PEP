import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

export async function seedFinancialDefaults(prisma: PrismaClient, tenantId: string) {
  console.log(`  💰 Semeando dados financeiros padrão para o tenant...`);

  const defaultChartOfAccounts = [
    // RECEITAS
    { codigo: '3', nome: 'RECEITAS', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: false, codigoPai: null },
    { codigo: '3.1', nome: 'Receitas Operacionais', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: false, codigoPai: '3' },
    { codigo: '3.1.1', nome: 'Receitas de Convênios', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: true, codigoPai: '3.1' },
    { codigo: '3.1.2', nome: 'Receitas Particulares', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: true, codigoPai: '3.1' },
    { codigo: '3.1.3', nome: 'Receitas SUS', tipo: 'RECEITA', natureza: 'CREDORA', aceitaLancamento: true, codigoPai: '3.1' },
    // DESPESAS
    { codigo: '4', nome: 'DESPESAS', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false, codigoPai: null },
    { codigo: '4.1', nome: 'Despesas com Pessoal', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false, codigoPai: '4' },
    { codigo: '4.1.1', nome: 'Salários e Ordenados', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: true, codigoPai: '4.1' },
    { codigo: '4.1.2', nome: 'Honorários Médicos', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: true, codigoPai: '4.1' },
    { codigo: '4.2', nome: 'Despesas Operacionais', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: false, codigoPai: '4' },
    { codigo: '4.2.1', nome: 'Materiais e Medicamentos', tipo: 'DESPESA', natureza: 'DEVEDORA', aceitaLancamento: true, codigoPai: '4.2' },
  ];

  for (const acc of defaultChartOfAccounts) {
    await prisma.chartOfAccounts.upsert({
      where: { tenantId_codigo: { tenantId, codigo: acc.codigo } },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenantId,
        codigo: acc.codigo,
        nome: acc.nome,
        tipo: acc.tipo as any,
        natureza: acc.natureza as any,
        codigoPai: acc.codigoPai,
        aceitaLancamento: acc.aceitaLancamento,
        ativo: true,
      }
    });
  }

  const defaultCostCenters = [
    { codigo: '100', nome: 'UTI Adulto', tipo: 'CLINICO' },
    { codigo: '102', nome: 'Centro Cirúrgico', tipo: 'CLINICO' },
    { codigo: '200', nome: 'Laboratório', tipo: 'APOIO' },
    { codigo: '202', nome: 'Farmácia', tipo: 'APOIO' },
    { codigo: '300', nome: 'Administração', tipo: 'ADMINISTRATIVO' },
    { codigo: '301', nome: 'Faturamento', tipo: 'ADMINISTRATIVO' },
  ];

  for (const cc of defaultCostCenters) {
    await prisma.costCenter.upsert({
      where: { tenantId_codigo: { tenantId, codigo: cc.codigo } },
      update: {},
      create: {
        id: crypto.randomUUID(),
        tenantId,
        codigo: cc.codigo,
        nome: cc.nome,
        tipo: cc.tipo as any,
        ativo: true,
      }
    });
  }
}