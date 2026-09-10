import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionLifecycle, INATIVIDADE_MS } from './useSessionLifecycle';
import { setSessaoTokens, SESSAO_STORAGE_KEY } from '@/shared/infrastructure/storage/token-storage';

describe('useSessionLifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('agenda a renovação automática para antes da expiração informada e chama o callback quando o timer estoura', async () => {
    setSessaoTokens({
      accessToken: "a",
      refreshToken: "r",
      accessTokenExpiraEm: Date.now() + 5 * 60_000, // 5 min
      refreshTokenExpiraEm: Date.now() + 60 * 60_000,
    });
    const renovar = vi.fn().mockResolvedValue("novo-token");
    const onSessionExpired = vi.fn();

    renderHook(() => useSessionLifecycle({ ativo: true, renovarSessaoSeNecessario: renovar, onSessionExpired }));

    // margem = max(60s, 5min*0.25=75s) = 75s -> dispara aos 5min-75s = 225s
    expect(renovar).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(225_000);
    expect(renovar).toHaveBeenCalledTimes(1);
  });

  it('dispara onSessionExpired depois de INATIVIDADE_MS sem nenhum evento de atividade', () => {
    setSessaoTokens({
      accessToken: "a",
      refreshToken: "r",
      accessTokenExpiraEm: Date.now() + 60 * 60_000,
      refreshTokenExpiraEm: Date.now() + 60 * 60_000,
    });
    const renovar = vi.fn().mockResolvedValue("novo-token");
    const onSessionExpired = vi.fn();

    renderHook(() => useSessionLifecycle({ ativo: true, renovarSessaoSeNecessario: renovar, onSessionExpired }));

    vi.advanceTimersByTime(INATIVIDADE_MS);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('um evento de atividade reseta o timer de inatividade', () => {
    setSessaoTokens({
      accessToken: "a",
      refreshToken: "r",
      accessTokenExpiraEm: Date.now() + 60 * 60_000,
      refreshTokenExpiraEm: Date.now() + 60 * 60_000,
    });
    const renovar = vi.fn().mockResolvedValue("novo-token");
    const onSessionExpired = vi.fn();

    renderHook(() => useSessionLifecycle({ ativo: true, renovarSessaoSeNecessario: renovar, onSessionExpired }));

    // avança quase até o limite
    vi.advanceTimersByTime(INATIVIDADE_MS - 1000);
    expect(onSessionExpired).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('mousemove'));

    // avança de novo o suficiente pra estourar o prazo antigo, mas não o novo (resetado pelo evento)
    vi.advanceTimersByTime(2000);
    expect(onSessionExpired).not.toHaveBeenCalled();

    // agora estoura o novo prazo
    vi.advanceTimersByTime(INATIVIDADE_MS - 2000);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('evento storage (outra aba limpando a sessão) dispara onSessionExpired na aba atual', () => {
    setSessaoTokens({
      accessToken: "a",
      refreshToken: "r",
      accessTokenExpiraEm: Date.now() + 60 * 60_000,
      refreshTokenExpiraEm: Date.now() + 60 * 60_000,
    });
    const renovar = vi.fn().mockResolvedValue("novo-token");
    const onSessionExpired = vi.fn();

    renderHook(() => useSessionLifecycle({ ativo: true, renovarSessaoSeNecessario: renovar, onSessionExpired }));

    window.dispatchEvent(new StorageEvent('storage', { key: SESSAO_STORAGE_KEY, newValue: null }));

    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });
});
