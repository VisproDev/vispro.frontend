import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AddFuncionarioPage } from './AddFuncionarioPage';

const { adicionarFuncionario, adicionarFuncionarioPorEmail } = vi.hoisted(() => ({
  adicionarFuncionario: vi.fn(),
  adicionarFuncionarioPorEmail: vi.fn(),
}));

vi.mock('../infrastructure/empresas-api', () => ({ adicionarFuncionario, adicionarFuncionarioPorEmail }));

const SOLICITACAO = { handle: 1, empresaHandle: 7, usuarioHandle: 2, status: "Pendente" } as const;

function abrirAbaEmail() {
  fireEvent.click(screen.getByRole("radio", { name: "Por e-mail" }));
}

describe('AddFuncionarioPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('convida por e-mail com sucesso, limpa o campo e chama onAdded', async () => {
    adicionarFuncionarioPorEmail.mockResolvedValueOnce(SOLICITACAO);
    const onAdded = vi.fn();

    render(<AddFuncionarioPage empresaHandle={7} onAdded={onAdded} />);
    abrirAbaEmail();

    fireEvent.change(screen.getByLabelText("E-mail do funcionário"), { target: { value: "  maria@exemplo.com  " } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(adicionarFuncionarioPorEmail).toHaveBeenCalledWith(7, "maria@exemplo.com");
    });
    expect(screen.getByText("Convite enviado para maria@exemplo.com.")).toBeTruthy();
    expect(onAdded).toHaveBeenCalledTimes(1);
  });

  it('exibe a mensagem de e-mail não encontrado vinda do backend em caso de 404', async () => {
    adicionarFuncionarioPorEmail.mockRejectedValueOnce(new Error("Nenhuma conta encontrada com o e-mail inexistente@exemplo.com"));

    render(<AddFuncionarioPage empresaHandle={7} />);
    abrirAbaEmail();

    fireEvent.change(screen.getByLabelText("E-mail do funcionário"), { target: { value: "inexistente@exemplo.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(screen.getByText("Nenhuma conta encontrada com o e-mail inexistente@exemplo.com")).toBeTruthy();
    });
  });

  it('exibe a mensagem de convite duplicado em caso de 409', async () => {
    adicionarFuncionarioPorEmail.mockRejectedValueOnce(new Error("Já existe uma solicitação pendente para esse usuário nessa empresa."));

    render(<AddFuncionarioPage empresaHandle={7} />);
    abrirAbaEmail();

    fireEvent.change(screen.getByLabelText("E-mail do funcionário"), { target: { value: "maria@exemplo.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(screen.getByText("Já existe uma solicitação pendente para esse usuário nessa empresa.")).toBeTruthy();
    });
  });

  it('desabilita o botão com e-mail vazio e habilita ao preencher', () => {
    render(<AddFuncionarioPage empresaHandle={7} />);
    abrirAbaEmail();

    const botao = screen.getByRole("button", { name: "Adicionar" });
    expect(botao.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("E-mail do funcionário"), { target: { value: "maria@exemplo.com" } });
    expect(screen.getByRole("button", { name: "Adicionar" }).hasAttribute("disabled")).toBe(false);
  });

  it('mostra aviso e não chama a API com e-mail malformado', async () => {
    render(<AddFuncionarioPage empresaHandle={7} />);
    abrirAbaEmail();

    fireEvent.change(screen.getByLabelText("E-mail do funcionário"), { target: { value: "nao-e-um-email" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(screen.getByText("E-mail inválido — confira o endereço informado")).toBeTruthy();
    });
    expect(adicionarFuncionarioPorEmail).not.toHaveBeenCalled();
  });

  it('regressão: o fluxo por key continua renderizando e disparando adicionarFuncionario', async () => {
    adicionarFuncionario.mockResolvedValueOnce(SOLICITACAO);
    const onAdded = vi.fn();

    render(<AddFuncionarioPage empresaHandle={7} onAdded={onAdded} />);

    fireEvent.change(screen.getByLabelText("Key do funcionário"), { target: { value: "func-abc1" } });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(adicionarFuncionario).toHaveBeenCalledWith(7, "FUNC-ABC1");
    });
    expect(screen.getByText("Convite enviado para FUNC-ABC1.")).toBeTruthy();
    expect(onAdded).toHaveBeenCalledTimes(1);
  });
});