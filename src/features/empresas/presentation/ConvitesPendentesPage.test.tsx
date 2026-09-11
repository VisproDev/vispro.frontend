import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConvitesPendentesPage } from './ConvitesPendentesPage';

const { listarConvitesPendentes, aceitarSolicitacao, negarSolicitacao } = vi.hoisted(() => ({
  listarConvitesPendentes: vi.fn(),
  aceitarSolicitacao: vi.fn(),
  negarSolicitacao: vi.fn(),
}));

vi.mock('../infrastructure/empresas-api', () => ({
  listarConvitesPendentes,
  aceitarSolicitacao,
  negarSolicitacao,
}));

const CONVITE_1 = { handle: 1, empresaHandle: 10, empresaNome: "Imobiliária Aurora" };
const CONVITE_2 = { handle: 2, empresaHandle: 20, empresaNome: "Vistoria Fácil" };

describe('ConvitesPendentesPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('lista os convites pendentes com o nome da empresa', async () => {
    listarConvitesPendentes.mockResolvedValueOnce([CONVITE_1, CONVITE_2]);

    render(<ConvitesPendentesPage />);

    await waitFor(() => {
      expect(screen.getByText("Imobiliária Aurora")).toBeTruthy();
    });
    expect(screen.getByText("Vistoria Fácil")).toBeTruthy();
  });

  it('mostra o estado vazio quando não há convites pendentes', async () => {
    listarConvitesPendentes.mockResolvedValueOnce([]);

    render(<ConvitesPendentesPage />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum convite pendente")).toBeTruthy();
    });
  });

  it('aceita um convite, remove da lista e mostra feedback de sucesso', async () => {
    listarConvitesPendentes.mockResolvedValueOnce([CONVITE_1]);
    aceitarSolicitacao.mockResolvedValueOnce({ handle: 1, empresaHandle: 10, usuarioHandle: 5, status: "Aceito" });

    render(<ConvitesPendentesPage />);
    await waitFor(() => expect(screen.getByText("Imobiliária Aurora")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Aceitar" }));

    await waitFor(() => {
      expect(aceitarSolicitacao).toHaveBeenCalledWith(10, 1);
    });
    await waitFor(() => {
      expect(screen.queryByText("Imobiliária Aurora")).toBeNull();
    });
    expect(screen.getByText("Você agora faz parte da equipe de Imobiliária Aurora.")).toBeTruthy();
    expect(screen.getByText("Nenhum convite pendente")).toBeTruthy();
  });

  it('recusa um convite após confirmar no diálogo e remove da lista', async () => {
    listarConvitesPendentes.mockResolvedValueOnce([CONVITE_1]);
    negarSolicitacao.mockResolvedValueOnce({ handle: 1, empresaHandle: 10, usuarioHandle: 5, status: "Negado" });

    render(<ConvitesPendentesPage />);
    await waitFor(() => expect(screen.getByText("Imobiliária Aurora")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Recusar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Recusar convite" }));

    await waitFor(() => {
      expect(negarSolicitacao).toHaveBeenCalledWith(10, 1);
    });
    await waitFor(() => {
      expect(screen.queryByText("Imobiliária Aurora")).toBeNull();
    });
    expect(screen.getByText("Convite de Imobiliária Aurora recusado.")).toBeTruthy();
  });

  it('exibe mensagem de erro do backend quando aceitar falha, sem remover o item', async () => {
    listarConvitesPendentes.mockResolvedValueOnce([CONVITE_1]);
    aceitarSolicitacao.mockRejectedValueOnce(new Error("Só é possível aceitar ou negar uma solicitação pendente."));

    render(<ConvitesPendentesPage />);
    await waitFor(() => expect(screen.getByText("Imobiliária Aurora")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Aceitar" }));

    await waitFor(() => {
      expect(screen.getByText("Só é possível aceitar ou negar uma solicitação pendente.")).toBeTruthy();
    });
    expect(screen.getByText("Imobiliária Aurora")).toBeTruthy();
  });
});
