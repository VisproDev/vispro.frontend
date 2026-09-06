import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { setToken } from '@/shared/infrastructure/storage/token-storage';
import type { Usuario } from '../domain/usuario';
import type { PerfilUsuario } from '../domain/perfil';

export interface CriarContaInput {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

/** POST /api/usuarios — registra um novo usuário. Não exige autenticação. */
export async function criarConta(data: CriarContaInput): Promise<Usuario> {
  return apiRequest<Usuario>("/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Autentica no Keycloak (grant password) e persiste o access token. */
export async function loginKeycloak(email: string, senha: string): Promise<string> {
  const body = new URLSearchParams();
  body.append("client_id", "VisproApi");
  body.append("client_secret", "sxGLZ8hjPDRpkG9uXSk4KkFKb2dODSEg");
  body.append("grant_type", "password");
  body.append("username", email);
  body.append("password", senha);

  const res = await fetch("/keycloak/realms/Vispro/protocol/openid-connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? "E-mail ou senha inválidos" : "Erro ao autenticar no Keycloak");
  }

  const data = await res.json();
  setToken(data.access_token);
  return data.access_token;
}

/** GET /api/usuarios/me — perfil do usuário autenticado, incluindo a empresa da qual é dono (se houver). */
export async function buscarPerfilAtual(token: string): Promise<PerfilUsuario> {
  return apiRequest<PerfilUsuario>("/usuarios/me", { method: "GET" }, token);
}
