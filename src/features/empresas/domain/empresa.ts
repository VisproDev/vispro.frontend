export interface Empresa {
  handle: number;
  nome: string;
  usuarioDonoHandle: number;
}

export type StatusSolicitacao = "Pendente" | "Aceito" | "Negado";

export interface Solicitacao {
  handle: number;
  empresaHandle: number;
  usuarioHandle: number;
  status: StatusSolicitacao;
}

/** Item retornado por GET /api/empresas/:empresaHandle/funcionarios. */
export interface FuncionarioEmpresa {
  handle: number;
  keyPublica: string;
  nome: string;
  sobrenome: string;
  email: string;
  status: StatusSolicitacao;
}
