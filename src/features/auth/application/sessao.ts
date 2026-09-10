import { registerSessionHandlers } from '@/shared/infrastructure/http/http-client';
import {
  clearSessaoTokens,
  getSessaoTokens,
  setSessaoTokens,
} from '@/shared/infrastructure/storage/token-storage';
import { buscarPerfilAtual, loginKeycloak, renovarTokenKeycloak, revogarTokenKeycloak } from '../infrastructure/auth-api';
import type { PerfilUsuario } from '../domain/perfil';

/** Caso de uso: autentica no Keycloak, persiste o pacote de tokens e busca o perfil. */
export async function iniciarSessao(email: string, senha: string): Promise<PerfilUsuario> {
  const sessao = await loginKeycloak(email, senha);
  return buscarPerfilAtual(sessao.accessToken);
}

/**
 * Caso de uso: lido no bootstrap do App para restaurar a sessão ao recarregar a página.
 * - sem sessão salva          -> null
 * - access token ainda válido -> busca o perfil direto
 * - access expirado, refresh válido -> renova e busca o perfil com o novo token
 * - refresh também expirado/inválido, ou qualquer chamada falha -> limpa e retorna null
 */
export async function restaurarSessao(): Promise<PerfilUsuario | null> {
  const sessao = getSessaoTokens();
  if (!sessao) return null;

  if (sessao.accessTokenExpiraEm > Date.now()) {
    try {
      return await buscarPerfilAtual(sessao.accessToken);
    } catch {
      // token "válido" pelo relógio do cliente pode já ter sido revogado no servidor — cai pro fluxo de renovação abaixo
    }
  }

  const novoAccessToken = await renovarSessaoSeNecessario();
  if (!novoAccessToken) return null;

  try {
    return await buscarPerfilAtual(novoAccessToken);
  } catch {
    encerrarSessaoLocal();
    return null;
  }
}

let refreshEmVoo: Promise<string | null> | null = null;

/**
 * Caso de uso: renova o access token usando o refresh token salvo. Usado tanto pelo timer de
 * auto-refresh quanto pelo interceptor de 401 do http-client. Single-flight: chamadas concorrentes
 * reaproveitam a mesma promise em vez de disparar refreshes paralelos (o Keycloak pode rotacionar/
 * invalidar o refresh token a cada uso).
 */
export function renovarSessaoSeNecessario(): Promise<string | null> {
  if (refreshEmVoo) return refreshEmVoo;

  const execucao = (async () => {
    const sessao = getSessaoTokens();
    if (!sessao) return null;

    if (sessao.refreshTokenExpiraEm <= Date.now()) {
      encerrarSessaoLocal();
      return null;
    }

    try {
      const novaSessao = await renovarTokenKeycloak(sessao.refreshToken);
      setSessaoTokens(novaSessao);
      return novaSessao.accessToken;
    } catch {
      encerrarSessaoLocal();
      return null;
    }
  })();

  // .finally() sempre agenda seu callback como microtask, mesmo se `execucao` já tiver resolvido
  // de forma síncrona — isso evita o efeito colateral de reatribuir refreshEmVoo (na linha de baixo)
  // por cima do `refreshEmVoo = null` se ambos rodassem na mesma tarefa síncrona.
  refreshEmVoo = execucao.finally(() => {
    refreshEmVoo = null;
  });

  return refreshEmVoo;
}

/** Caso de uso: logout manual — revoga o refresh token no Keycloak (best-effort) e limpa a sessão local. */
export async function encerrarSessao(): Promise<void> {
  const sessao = getSessaoTokens();
  if (sessao?.refreshToken) {
    try {
      await revogarTokenKeycloak(sessao.refreshToken);
    } catch {
      // best-effort: Keycloak fora do ar não pode deixar o usuário preso logado
    }
  }
  encerrarSessaoLocal();
}

function encerrarSessaoLocal(): void {
  clearSessaoTokens();
}

let sessaoExpiradaCallback: (() => void) | null = null;

/** Registrado uma vez no bootstrap do App para saber quando levar o usuário de volta ao login
 *  (401 sem conseguir renovar, inatividade, ou logout em outra aba). */
export function setSessaoExpiradaCallback(cb: (() => void) | null): void {
  sessaoExpiradaCallback = cb;
}

function notificarSessaoExpirada(): void {
  encerrarSessaoLocal();
  sessaoExpiradaCallback?.();
}

registerSessionHandlers({
  renew: renovarSessaoSeNecessario,
  onSessionExpired: notificarSessaoExpirada,
});
