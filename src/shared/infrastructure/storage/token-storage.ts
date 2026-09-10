import type { SessaoTokens } from '@/features/auth/domain/sessao';

const TOKEN_KEY = "vispro_token";
const SESSAO_KEY = "vispro_sessao";

/** Acesso ao localStorage embrulhado — se indisponível (modo privado, quota cheia),
 *  falha silenciosamente em vez de derrubar a aba com uma exceção não tratada. */
function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // sessão não persiste entre reloads nesta aba, mas a aba atual segue funcionando em memória
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignora — mesmo raciocínio de safeSet
  }
}

/** Mantido para os call sites existentes (vistorias-api.ts, empresas-api.ts) — devolve o access token atual. */
export function getToken(): string {
  const sessao = getSessaoTokens();
  if (sessao) return sessao.accessToken;
  return safeGet(TOKEN_KEY) || "";
}

/** @deprecated usar setSessaoTokens — mantido só como fallback de compatibilidade. */
export function setToken(token: string) {
  safeSet(TOKEN_KEY, token);
}

export function clearToken() {
  safeRemove(TOKEN_KEY);
  safeRemove(SESSAO_KEY);
}

export function getSessaoTokens(): SessaoTokens | null {
  const raw = safeGet(SESSAO_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SessaoTokens>;
    if (
      typeof parsed.accessToken !== "string" ||
      typeof parsed.refreshToken !== "string" ||
      typeof parsed.accessTokenExpiraEm !== "number" ||
      typeof parsed.refreshTokenExpiraEm !== "number"
    ) {
      return null;
    }
    return parsed as SessaoTokens;
  } catch {
    return null;
  }
}

export function setSessaoTokens(sessao: SessaoTokens): void {
  safeSet(SESSAO_KEY, JSON.stringify(sessao));
  // mantém a chave legada em sincronia, caso algum código ainda leia setToken/getToken direto
  safeSet(TOKEN_KEY, sessao.accessToken);
}

export function clearSessaoTokens(): void {
  clearToken();
}

export const SESSAO_STORAGE_KEY = SESSAO_KEY;
