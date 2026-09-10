import { useEffect, useRef } from 'react';
import { getSessaoTokens, SESSAO_STORAGE_KEY } from '@/shared/infrastructure/storage/token-storage';

export const INATIVIDADE_MS = 30 * 60 * 1000;
const ATIVIDADE_DEBOUNCE_MS = 500;
const ATIVIDADE_EVENTOS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

export interface UseSessionLifecycleOptions {
  /** só agenda timers/listeners enquanto há uma sessão ativa (ex.: stage === "app"). */
  ativo: boolean;
  renovarSessaoSeNecessario: () => Promise<string | null>;
  onSessionExpired: () => void;
  inatividadeMs?: number;
}

/**
 * Ciclo de vida da sessão no cliente: agenda a renovação automática do access token antes de
 * expirar, encerra a sessão por inatividade e sincroniza logout entre abas via evento `storage`.
 * IDs de timer ficam em useRef (não em estado) para não re-renderizar a árvore a cada refresh agendado.
 */
export function useSessionLifecycle({
  ativo,
  renovarSessaoSeNecessario,
  onSessionExpired,
  inatividadeMs = INATIVIDADE_MS,
}: UseSessionLifecycleOptions): void {
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inatividadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // refs para não precisar recriar os listeners/timers a cada render quando os callbacks mudam de identidade
  const renovarRef = useRef(renovarSessaoSeNecessario);
  const onExpiredRef = useRef(onSessionExpired);

  useEffect(() => {
    renovarRef.current = renovarSessaoSeNecessario;
    onExpiredRef.current = onSessionExpired;
  }, [renovarSessaoSeNecessario, onSessionExpired]);

  useEffect(() => {
    if (!ativo) return;

    function agendarRenovacao() {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      const sessao = getSessaoTokens();
      if (!sessao) return;

      const restante = sessao.accessTokenExpiraEm - Date.now();
      // renova 60s antes de expirar, ou em 75% do TTL se o token for de vida muito curta
      const margem = Math.max(60_000, restante * 0.25);
      const delay = Math.max(0, restante - margem);

      refreshTimeoutRef.current = setTimeout(async () => {
        const novoToken = await renovarRef.current();
        if (novoToken) {
          agendarRenovacao();
        } else {
          onExpiredRef.current();
        }
      }, delay);
    }

    function resetarInatividade() {
      if (inatividadeTimeoutRef.current) clearTimeout(inatividadeTimeoutRef.current);
      inatividadeTimeoutRef.current = setTimeout(() => {
        onExpiredRef.current();
      }, inatividadeMs);
    }

    function onAtividade() {
      if (debounceRef.current) return;
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
      }, ATIVIDADE_DEBOUNCE_MS);
      resetarInatividade();
    }

    function onStorage(e: StorageEvent) {
      // outra aba limpou a sessão (logout, expiração) -> encerra localmente também
      if (e.key === SESSAO_STORAGE_KEY && e.newValue == null) {
        onExpiredRef.current();
      }
    }

    agendarRenovacao();
    resetarInatividade();

    ATIVIDADE_EVENTOS.forEach(evento => window.addEventListener(evento, onAtividade, { passive: true }));
    window.addEventListener('storage', onStorage);

    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (inatividadeTimeoutRef.current) clearTimeout(inatividadeTimeoutRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ATIVIDADE_EVENTOS.forEach(evento => window.removeEventListener(evento, onAtividade));
      window.removeEventListener('storage', onStorage);
    };
  }, [ativo, inatividadeMs]);
}
