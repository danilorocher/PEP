export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = 11 - (soma % 11);
  let digito1 = resto === 10 || resto === 11 ? 0 : resto;
  if (digito1 !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = 11 - (soma % 11);
  let digito2 = resto === 10 || resto === 11 ? 0 : resto;

  return digito2 === parseInt(cpf.charAt(10));
}

export function isValidCNS(cns: string): boolean {
  cns = cns.replace(/[^\d]+/g, '');
  if (cns.length !== 15) return false;

  const initial = cns.charAt(0);
  if (!['1', '2', '7', '8', '9'].includes(initial)) return false;

  let soma = 0;
  for (let i = 0; i < 15; i++) {
    soma += parseInt(cns.charAt(i)) * (15 - i);
  }

  return soma % 11 === 0;
}