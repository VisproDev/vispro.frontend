import { useCallback, useEffect, useState } from 'react';
import { aceitarSolicitacao, listarConvitesPendentes, negarSolicitacao } from '../infrastructure/empresas-api';
import type { ConvitePendente } from '../domain/empresa';

export type DecisaoConvite = "aceitar" | "recusar";

interface UseConvitesPendentesResult {
  convites: ConvitePendente[];
  loading: boolean;
  error: string;
  successMessage: string;
  actionLoadingHandle: number | null;
  responderConvite: (convite: ConvitePendente, decisao: DecisaoConvite) => Promise<void>;
}

/** Caso de uso: carrega os convites de empresa pendentes do usuário logado e orquestra a decisão
 *  (aceitar/recusar) de cada um, expondo o estado de loading/erro/sucesso para a tela. */
export function useConvitesPendentes(): UseConvitesPendentesResult {
  const [convites, setConvites] = useState<ConvitePendente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoadingHandle, setActionLoadingHandle] = useState<number | null>(null);

  useEffect(() => {
    let cancelado = false;

    listarConvitesPendentes()
      .then(lista => { if (!cancelado) setConvites(lista); })
      .catch(err => {
        if (!cancelado) setError((err instanceof Error ? err.message : "") || "Erro ao carregar convites pendentes");
      })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, []);

  const responderConvite = useCallback(async (convite: ConvitePendente, decisao: DecisaoConvite) => {
    setError("");
    setSuccessMessage("");
    setActionLoadingHandle(convite.handle);
    try {
      if (decisao === "aceitar") {
        await aceitarSolicitacao(convite.empresaHandle, convite.handle);
        setSuccessMessage(`Você agora faz parte da equipe de ${convite.empresaNome}.`);
      } else {
        await negarSolicitacao(convite.empresaHandle, convite.handle);
        setSuccessMessage(`Convite de ${convite.empresaNome} recusado.`);
      }
      setConvites(prev => prev.filter(c => c.handle !== convite.handle));
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : "") ||
          (decisao === "aceitar" ? "Erro ao aceitar convite" : "Erro ao recusar convite"),
      );
    } finally {
      setActionLoadingHandle(null);
    }
  }, []);

  return { convites, loading, error, successMessage, actionLoadingHandle, responderConvite };
}
