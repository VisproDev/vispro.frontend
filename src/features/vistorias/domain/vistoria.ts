export type TipoVistoria = "Entrada" | "Saida" | "Predial" | "Conferencia";

/** Vistoriador responsável, como vem dentro da vistoria. */
export interface VistoriadorVistoria {
  handle: number;
  keyPublica: string;
  nome: string;
  sobrenome: string;
}

export interface Vistoria {
  handle: number;
  empresaHandle: number;
  tipo: TipoVistoria;
  /** YYYY-MM-DD, exatamente como enviado. */
  data: string;
  /** HH:mm (24h), exatamente como enviado. */
  horario: string;
  /** Junção de data + horário, devolvida em UTC. */
  dataHora: string;
  duracaoMinutos: number;
  endereco: string;
  bairroCidade: string;
  cliente: string;
  observacoes: string | null;
  vistoriador: VistoriadorVistoria;
}

/** Corpo do POST /api/empresas/:empresaHandle/vistorias. */
export interface AgendarVistoriaInput {
  tipo: TipoVistoria;
  data: string;
  horario: string;
  /** Inteiro entre 15 e 480. */
  duracaoMinutos: number;
  endereco: string;
  bairroCidade: string;
  cliente: string;
  keyPublicaVistoriador: string;
  observacoes?: string | null;
}

/** Filtro de status aceito pelo GET /api/empresas/:empresaHandle/vistorias. */
export type StatusFiltroVistoria = "Todas" | "Hoje" | "Proximas" | "EmAberto" | "Concluidas";

/** Query params do GET /api/empresas/:empresaHandle/vistorias. */
export interface ListarVistoriasParams {
  status?: StatusFiltroVistoria;
  tipo?: TipoVistoria;
  endereco?: string;
  vistoriadorHandle?: number;
  pagina?: number;
  tamanhoPagina?: number;
}

/** Resposta paginada do GET /api/empresas/:empresaHandle/vistorias. */
export interface PaginaVistorias {
  itens: Vistoria[];
  total: number;
  pagina: number;
  tamanhoPagina: number;
  totalPaginas: number;
}

/** Status de exibição derivado de dataHora + duracaoMinutos — a API não guarda status por vistoria. */
export type StatusVistoriaComputado = "Agendada" | "Em andamento" | "Concluída";

export function calcularStatusVistoria(
  vistoria: Pick<Vistoria, "dataHora" | "duracaoMinutos">,
  agora: Date = new Date(),
): StatusVistoriaComputado {
  const inicio = new Date(vistoria.dataHora).getTime();
  const fim = inicio + vistoria.duracaoMinutos * 60000;
  const agoraMs = agora.getTime();
  if (agoraMs >= fim) return "Concluída";
  if (agoraMs >= inicio) return "Em andamento";
  return "Agendada";
}
