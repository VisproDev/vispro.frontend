import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  encerrarSessao,
  renovarSessaoSeNecessario,
  restaurarSessao,
} from './sessao';
import { getSessaoTokens, setSessaoTokens } from '@/shared/infrastructure/storage/token-storage';
import type { SessaoTokens } from '../domain/sessao';
import type { PerfilUsuario } from '../domain/perfil';

const KEYCLOAK_TOKEN_URL = "/keycloak/realms/Vispro/protocol/openid-connect/token";
const KEYCLOAK_LOGOUT_URL = "/keycloak/realms/Vispro/protocol/openid-connect/logout";

const PERFIL: PerfilUsuario = {
  handle: 1,
  keyPublica: "abc",
  nome: "Maria",
  sobrenome: "Silva",
  email: "maria@empresa.com",
  empresaDona: null,
};

function sessaoValida(overrides: Partial<SessaoTokens> = {}): SessaoTokens {
  const agora = Date.now();
  return {
    accessToken: "access-valido",
    refreshToken: "refresh-valido",
    accessTokenExpiraEm: agora + 5 * 60_000,
    refreshTokenExpiraEm: agora + 60 * 60_000,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe('sessao (application)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('restaurarSessao retorna o perfil quando o access token salvo ainda é válido, sem chamar refresh', async () => {
    setSessaoTokens(sessaoValida());
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes('/usuarios/me')) return jsonResponse(PERFIL);
      throw new Error(`chamada inesperada: ${url}`);
    });

    const perfil = await restaurarSessao();

    expect(perfil).toEqual(PERFIL);
    const chamadasDeRefresh = fetchMock.mock.calls.filter(([url]) => url === KEYCLOAK_TOKEN_URL);
    expect(chamadasDeRefresh).toHaveLength(0);
  });

  it('restaurarSessao renova quando o access token expirou mas o refresh ainda é válido, e retorna o perfil com o novo token', async () => {
    const agora = Date.now();
    setSessaoTokens(sessaoValida({ accessTokenExpiraEm: agora - 1000 }));

    fetchMock.mockImplementation(async (url: string) => {
      if (url === KEYCLOAK_TOKEN_URL) {
        return jsonResponse({
          access_token: "access-novo",
          refresh_token: "refresh-novo",
          expires_in: 300,
          refresh_expires_in: 3600,
          token_type: "Bearer",
        });
      }
      if (url.includes('/usuarios/me')) return jsonResponse(PERFIL);
      throw new Error(`chamada inesperada: ${url}`);
    });

    const perfil = await restaurarSessao();

    expect(perfil).toEqual(PERFIL);
    expect(getSessaoTokens()?.accessToken).toBe("access-novo");
    // /usuarios/me deve ter sido chamado com o token novo
    const chamadaPerfil = fetchMock.mock.calls.find(([url]) => url.toString().includes('/usuarios/me'));
    expect(chamadaPerfil?.[1]?.headers?.Authorization).toBe("Bearer access-novo");
  });

  it('restaurarSessao retorna null e limpa o storage quando o refresh token está expirado/o Keycloak rejeita', async () => {
    setSessaoTokens(sessaoValida({ accessTokenExpiraEm: Date.now() - 1000, refreshTokenExpiraEm: Date.now() - 1000 }));
    fetchMock.mockImplementation(async () => {
      throw new Error('não deveria chamar rede — refresh token já está expirado no cliente');
    });

    const perfil = await restaurarSessao();

    expect(perfil).toBeNull();
    expect(getSessaoTokens()).toBeNull();
  });

  it('restaurarSessao retorna null quando não há nada salvo', async () => {
    const perfil = await restaurarSessao();
    expect(perfil).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encerrarSessao limpa o storage local mesmo quando a chamada de revogação falha', async () => {
    setSessaoTokens(sessaoValida());
    fetchMock.mockImplementation(async (url: string) => {
      if (url === KEYCLOAK_LOGOUT_URL) throw new Error('rede fora do ar');
      throw new Error(`chamada inesperada: ${url}`);
    });

    await encerrarSessao();

    expect(getSessaoTokens()).toBeNull();
  });

  it('renovarSessaoSeNecessario chamado duas vezes em paralelo dispara uma única chamada de refresh (single-flight)', async () => {
    setSessaoTokens(sessaoValida());
    let chamadasDeRefresh = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === KEYCLOAK_TOKEN_URL) {
        chamadasDeRefresh += 1;
        return jsonResponse({
          access_token: "access-novo",
          refresh_token: "refresh-novo",
          expires_in: 300,
          refresh_expires_in: 3600,
          token_type: "Bearer",
        });
      }
      throw new Error(`chamada inesperada: ${url}`);
    });

    const [a, b] = await Promise.all([renovarSessaoSeNecessario(), renovarSessaoSeNecessario()]);

    expect(a).toBe("access-novo");
    expect(b).toBe("access-novo");
    expect(chamadasDeRefresh).toBe(1);
  });
});
