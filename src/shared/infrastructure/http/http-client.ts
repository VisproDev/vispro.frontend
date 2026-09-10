export const API_BASE = "/api";

export interface ApiError {
  erro: string;
  detalhes?: unknown[];
}

function formatarDetalhe(detalhe: unknown): string {
  if (typeof detalhe === "string") {
    return detalhe;
  }
  if (detalhe && typeof detalhe === "object" && "message" in detalhe) {
    const mensagem = (detalhe as { message?: unknown }).message;
    if (typeof mensagem === "string") {
      return mensagem;
    }
  }
  return "";
}

/** Lançado quando uma chamada autenticada recebe 401 e a renovação de sessão falha (ou não há handler
 *  registrado). Quem consome apiRequest pode tratar esse erro para levar o usuário de volta ao login. */
export class SessionExpiredError extends Error {
  constructor() {
    super("Sessão expirada");
    this.name = "SessionExpiredError";
  }
}

type RenewHandler = () => Promise<string | null>;
type SessionExpiredHandler = () => void;

// http-client é uma camada compartilhada e não pode depender de features/auth (violaria a ordem de
// dependência domain->application->infrastructure->presentation). Em vez de importar sessao.ts
// diretamente, expõe um ponto de registro que application/sessao.ts preenche no bootstrap do App.
let renewHandler: RenewHandler | null = null;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

export function registerSessionHandlers(handlers: {
  renew: RenewHandler;
  onSessionExpired: SessionExpiredHandler;
}): void {
  renewHandler = handlers.renew;
  sessionExpiredHandler = handlers.onSessionExpired;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  return doRequest<T>(path, options, token, /* isRetry */ false);
}

async function doRequest<T>(path: string, options: RequestInit, token: string | undefined, isRetry: boolean): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && token && !isRetry) {
    // apenas uma tentativa de renovação por chamada — nunca entra em loop se o backend
    // devolver 401 de novo depois do retry.
    if (renewHandler) {
      const novoToken = await renewHandler();
      if (novoToken) {
        return doRequest<T>(path, options, novoToken, /* isRetry */ true);
      }
    }
    sessionExpiredHandler?.();
    throw new SessionExpiredError();
  }

  if (!res.ok) {
    const err: Partial<ApiError> = await res.json().catch(() => ({}));
    const detalhesFormatados = (err.detalhes ?? []).map(formatarDetalhe).filter(Boolean);
    const mensagem = detalhesFormatados.length ? `${err.erro} ${detalhesFormatados.join(" ")}` : err.erro;
    throw new Error(mensagem || `Erro na requisição (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
