import type { AlertaDashboard, ProdutividadeDia, Vistoria, VistoriadorRanking } from '../domain/dashboard';

/**
 * Dados de exemplo do dashboard. Substituir por um `dashboard-api.ts` quando os
 * endpoints existirem — o restante da feature já trabalha com os tipos do domínio.
 */

/** Vistorias já fechadas no mês, fora as de hoje. */
export const VISTORIAS_NO_MES = 48;

export const VISTORIAS_DE_HOJE: Vistoria[] = [
  {
    handle: 1,
    horario: "09:30",
    tipo: "Entrada",
    endereco: "Av. Brigadeiro Faria Lima, 3477",
    bairro: "Itaim Bibi, SP",
    responsavel: "Carlos Oliveira",
    corResponsavel: "#F59E0B",
    status: "Concluída",
  },
  {
    handle: 2,
    horario: "13:00",
    tipo: "Saída",
    endereco: "Rua Teodoro Sampaio, 1820",
    bairro: "Pinheiros, SP",
    responsavel: "Rafael Moura",
    corResponsavel: "#8B5CF6",
    status: "Em andamento",
  },
  {
    handle: 3,
    horario: "14:00",
    tipo: "Conferência",
    endereco: "Av. Ipiranga, 318",
    bairro: "República, SP",
    responsavel: "Carlos Oliveira",
    corResponsavel: "#F59E0B",
    status: "Agendada",
  },
];

export const RANKING_VISTORIADORES: VistoriadorRanking[] = [
  { handle: 1, nome: "Camila Rocha", cargo: "Vistoriadora", cor: "#F59E0B", vistorias: 3, desempenho: 88 },
  { handle: 2, nome: "Marina Costa", cargo: "Vistoriadora Sênior", cor: "#0D9488", vistorias: 3, desempenho: 76 },
  { handle: 3, nome: "Thiago Almeida", cargo: "Vistoriador Jr.", cor: "#3B82F6", vistorias: 2, desempenho: 59 },
  { handle: 4, nome: "Carlos Oliveira", cargo: "Vistoriador Jr.", cor: "#F59E0B", vistorias: 2, desempenho: 51 },
  { handle: 5, nome: "Beatriz Lima", cargo: "Vistoriadora", cor: "#EC4899", vistorias: 1, desempenho: 32 },
];

export const ALERTAS: AlertaDashboard[] = [
  {
    handle: 1,
    tom: "sucesso",
    titulo: "1 vistoria em andamento agora",
    descricao: "Acompanhe pelo calendário ou aguarde o envio do laudo.",
    quando: "Em tempo real",
  },
  {
    handle: 2,
    tom: "info",
    titulo: "Renove o contrato com RE/Casa Imóveis",
    descricao: "Contrato de parceria vence em 12 dias.",
    quando: "Há 1 dia",
  },
];

export const PRODUTIVIDADE_SEMANA: ProdutividadeDia[] = [
  { dia: "Seg", valor: 28 },
  { dia: "Ter", valor: 39 },
  { dia: "Qua", valor: 30 },
  { dia: "Qui", valor: 53 },
  { dia: "Sex", valor: 38 },
  { dia: "Sáb", valor: 66 },
  { dia: "Dom", valor: 70 },
];
