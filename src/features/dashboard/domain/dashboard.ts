export type StatusVistoria = "Concluída" | "Em andamento" | "Agendada";

export interface Vistoria {
  handle: number;
  horario: string;
  tipo: string;
  endereco: string;
  bairro: string;
  responsavel: string;
  corResponsavel: string;
  status: StatusVistoria;
}

export interface VistoriadorRanking {
  handle: number;
  nome: string;
  cargo: string;
  cor: string;
  vistorias: number;
  /** Desempenho relativo no período, de 0 a 100. */
  desempenho: number;
}

export type TomAlerta = "sucesso" | "info";

export interface AlertaDashboard {
  handle: number;
  tom: TomAlerta;
  titulo: string;
  descricao: string;
  quando: string;
}

export interface ProdutividadeDia {
  dia: string;
  /** Percentual de vistorias concluídas no dia, de 0 a 100. */
  valor: number;
}
