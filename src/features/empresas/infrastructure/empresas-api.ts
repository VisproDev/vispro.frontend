import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { getToken } from '@/shared/infrastructure/storage/token-storage';
import type { Empresa, FuncionarioEmpresa, Solicitacao } from '../domain/empresa';

/** POST /api/empresas — cria uma empresa (dono é o usuário autenticado). */
export async function criarEmpresa(data: { nome: string }): Promise<Empresa> {
  return apiRequest<Empresa>("/empresas", {
    method: "POST",
    body: JSON.stringify(data),
  }, getToken());
}

/** POST /api/empresas/:empresaHandle/funcionarios — solicita vínculo de funcionário pela key. Só o dono da empresa. */
export async function adicionarFuncionario(empresaHandle: number, keyPublicaUsuario: string): Promise<Solicitacao> {
  return apiRequest<Solicitacao>(`/empresas/${empresaHandle}/funcionarios`, {
    method: "POST",
    body: JSON.stringify({ keyPublicaUsuario }),
  }, getToken());
}

/** POST /api/empresas/:empresaHandle/funcionarios — solicita vínculo de funcionário por e-mail. Só o dono da empresa. */
export async function adicionarFuncionarioPorEmail(empresaHandle: number, email: string): Promise<Solicitacao> {
  return apiRequest<Solicitacao>(`/empresas/${empresaHandle}/funcionarios`, {
    method: "POST",
    body: JSON.stringify({ email }),
  }, getToken());
}

/** POST /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle/aceitar — só o usuário alvo. */
export async function aceitarSolicitacao(empresaHandle: number, solicitacaoHandle: number): Promise<Solicitacao> {
  return apiRequest<Solicitacao>(`/empresas/${empresaHandle}/funcionarios/${solicitacaoHandle}/aceitar`, {
    method: "POST",
  }, getToken());
}

/** POST /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle/negar — só o usuário alvo. */
export async function negarSolicitacao(empresaHandle: number, solicitacaoHandle: number): Promise<Solicitacao> {
  return apiRequest<Solicitacao>(`/empresas/${empresaHandle}/funcionarios/${solicitacaoHandle}/negar`, {
    method: "POST",
  }, getToken());
}

/** POST /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle/cancelar — cancela solicitação pendente. Só o dono da empresa. */
export async function cancelarSolicitacao(empresaHandle: number, solicitacaoHandle: number): Promise<void> {
  return apiRequest<void>(`/empresas/${empresaHandle}/funcionarios/${solicitacaoHandle}/cancelar`, {
    method: "POST",
  }, getToken());
}

/** DELETE /api/empresas/:empresaHandle/funcionarios/:solicitacaoHandle — remove funcionário já aceito. Só o dono da empresa. */
export async function removerFuncionario(empresaHandle: number, solicitacaoHandle: number): Promise<void> {
  return apiRequest<void>(`/empresas/${empresaHandle}/funcionarios/${solicitacaoHandle}`, {
    method: "DELETE",
  }, getToken());
}

/** GET /api/empresas/:empresaHandle/funcionarios — lista os funcionários da empresa (nome, sobrenome e status). Só o dono. */
export async function listarFuncionarios(empresaHandle: number): Promise<FuncionarioEmpresa[]> {
  return apiRequest<FuncionarioEmpresa[]>(`/empresas/${empresaHandle}/funcionarios`, { method: "GET" }, getToken());
}

/** GET /api/usuarios/me/solicitacoes — solicitações de vínculo pendentes do usuário autenticado. */
export async function listarMinhasSolicitacoes(): Promise<Solicitacao[]> {
  return apiRequest<Solicitacao[]>("/usuarios/me/solicitacoes", { method: "GET" }, getToken());
}
