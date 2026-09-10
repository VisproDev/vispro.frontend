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

/** Payload de convite de funcionário — exatamente um dos dois campos deve ser enviado. */
export type ConviteFuncionario =
  | { keyPublicaUsuario: string }
  | { email: string };

/** Item retornado por GET /api/empresas/:empresaHandle/funcionarios. */
export interface FuncionarioEmpresa {
  handle: number;
  keyPublica: string;
  nome: string;
  sobrenome: string;
  email: string;
  status: StatusSolicitacao;
}
