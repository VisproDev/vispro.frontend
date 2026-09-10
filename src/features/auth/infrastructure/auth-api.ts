import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { setSessaoTokens } from '@/shared/infrastructure/storage/token-storage';
import type { Usuario } from '../domain/usuario';
import type { PerfilUsuario } from '../domain/perfil';
import type { SessaoTokens } from '../domain/sessao';

export interface CriarContaInput {
  nome: string;
  sobrenome: string;
  email: string;
  senha: string;
}

const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET;
const KEYCLOAK_TOKEN_URL = import.meta.env.VITE_KEYCLOAK_TOKEN_URL;
const KEYCLOAK_LOGOUT_URL = import.meta.env.VITE_KEYCLOAK_LOGOUT_URL;

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

function paraSessaoTokens(data: KeycloakTokenResponse): SessaoTokens {
  const agora = Date.now();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    accessTokenExpiraEm: agora + data.expires_in * 1000,
    refreshTokenExpiraEm: agora + data.refresh_expires_in * 1000,
  };
}

/** POST /api/usuarios — registra um novo usuário. Não exige autenticação. */
export async function criarConta(data: CriarContaInput): Promise<Usuario> {
  return apiRequest<Usuario>("/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Autentica no Keycloak (grant password), persiste o pacote de tokens e o devolve. */
export async function loginKeycloak(email: string, senha: string): Promise<SessaoTokens> {
  const body = new URLSearchParams();
  body.append("client_id", KEYCLOAK_CLIENT_ID);
  body.append("client_secret", KEYCLOAK_CLIENT_SECRET);
  body.append("grant_type", "password");
  body.append("username", email);
  body.append("password", senha);

  const res = await fetch(KEYCLOAK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(res.status === 401 ? "E-mail ou senha inválidos" : "Erro ao autenticar no Keycloak");
  }

  const sessao = paraSessaoTokens(await res.json());
  setSessaoTokens(sessao);
  return sessao;
}

/** Renova o pacote de tokens usando o refresh token atual. Não persiste — quem chama decide
 *  o que fazer com o resultado (single-flight fica em application/sessao.ts). */
export async function renovarTokenKeycloak(refreshToken: string): Promise<SessaoTokens> {
  const body = new URLSearchParams();
  body.append("client_id", KEYCLOAK_CLIENT_ID);
  body.append("client_secret", KEYCLOAK_CLIENT_SECRET);
  body.append("grant_type", "refresh_token");
  body.append("refresh_token", refreshToken);

  const res = await fetch(KEYCLOAK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("Refresh token expirado ou inválido");
  }

  return paraSessaoTokens(await res.json());
}

/** Revoga o refresh token no Keycloak (logout). Best-effort — quem chama decide se ignora falhas. */
export async function revogarTokenKeycloak(refreshToken: string): Promise<void> {
  const body = new URLSearchParams();
  body.append("client_id", KEYCLOAK_CLIENT_ID);
  body.append("client_secret", KEYCLOAK_CLIENT_SECRET);
  body.append("refresh_token", refreshToken);

  await fetch(KEYCLOAK_LOGOUT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** GET /api/usuarios/me — perfil do usuário autenticado, incluindo a empresa da qual é dono (se houver). */
export async function buscarPerfilAtual(token: string): Promise<PerfilUsuario> {
  return apiRequest<PerfilUsuario>("/usuarios/me", { method: "GET" }, token);
}
