export interface Inquilino {
  handle: number;
  empresaHandle: number;
  nome: string;
  /** Normalizado (sem máscara). */
  documento: string;
  telefone: string | null;
  email: string | null;
}

/** Corpo do POST /api/empresas/:empresaHandle/inquilinos. */
export interface CriarInquilinoInput {
  nome: string;
  documento: string;
  telefone?: string | null;
  email?: string | null;
}

/** Remove tudo que não for dígito — usado antes de enviar/validar o documento. */
export function normalizarDocumento(documento: string): string {
  return documento.replace(/\D/g, "");
}

/** Aplica a máscara de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00) conforme o tamanho. */
export function formatarDocumento(documento: string): string {
  const digitos = normalizarDocumento(documento).slice(0, 14);

  if (digitos.length <= 11) {
    return digitos
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digitos
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function calcularDigitoCpf(digitos: string, peso: number): number {
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    soma += Number(digitos[i]) * (peso - i);
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

function validarCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digito1 = calcularDigitoCpf(cpf.slice(0, 9), 10);
  const digito2 = calcularDigitoCpf(cpf.slice(0, 10), 11);
  return digito1 === Number(cpf[9]) && digito2 === Number(cpf[10]);
}

function calcularDigitoCnpj(digitos: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < digitos.length; i++) {
    soma += Number(digitos[i]) * pesos[i];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

const PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function validarCnpj(cnpj: string): boolean {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digito1 = calcularDigitoCnpj(cnpj.slice(0, 12), PESOS_CNPJ_1);
  const digito2 = calcularDigitoCnpj(cnpj.slice(0, 13), PESOS_CNPJ_2);
  return digito1 === Number(cnpj[12]) && digito2 === Number(cnpj[13]);
}

/** Valida o checksum de CPF (11 dígitos) ou CNPJ (14 dígitos). Aceita com ou sem máscara. */
export function validarDocumento(documento: string): boolean {
  const digitos = normalizarDocumento(documento);
  if (digitos.length === 11) return validarCpf(digitos);
  if (digitos.length === 14) return validarCnpj(digitos);
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Espelha o contrato do backend (`email().nullish()`): vazio é válido, senão precisa ter formato de email. */
export function validarEmail(email: string): boolean {
  return email.trim() === "" || EMAIL_REGEX.test(email.trim());
}

/** Retorna a posição (índice, base 0) do dígito de ordem `digitCount` dentro do texto já formatado. */
export function cursorAposDigito(formatado: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let vistos = 0;
  for (let i = 0; i < formatado.length; i++) {
    if (/\d/.test(formatado[i])) {
      vistos++;
      if (vistos === digitCount) return i + 1;
    }
  }
  return formatado.length;
}