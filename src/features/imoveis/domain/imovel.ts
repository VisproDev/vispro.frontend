export interface Imovel {
  handle: number;
  empresaHandle: number;
  endereco: string;
  tipo: string;
  metragem: number;
  numeroComodos: number;
}

/** Corpo do POST /api/empresas/:empresaHandle/imoveis. */
export interface CriarImovelInput {
  endereco: string;
  tipo: string;
  metragem: number;
  numeroComodos: number;
}

/** Opções do select de tipo do imóvel. */
export const TIPOS_IMOVEL = ["Casa", "Apartamento", "Comercial"] as const;

export function validarEndereco(endereco: string): boolean {
  return endereco.trim().length > 0;
}

export function validarTipo(tipo: string): boolean {
  return tipo.trim().length > 0;
}

export function validarMetragem(metragem: number): boolean {
  return Number.isFinite(metragem) && metragem > 0;
}

export function validarNumeroComodos(numeroComodos: number): boolean {
  return Number.isInteger(numeroComodos) && numeroComodos > 0;
}
