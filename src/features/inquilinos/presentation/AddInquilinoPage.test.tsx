import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import { AddInquilinoPage } from './AddInquilinoPage';

const { criarInquilino } = vi.hoisted(() => ({ criarInquilino: vi.fn() }));

vi.mock('../infrastructure/inquilinos-api', () => ({ criarInquilino }));

const company = {
  isEmployee: false,
  companyName: "Empresa Teste",
  empresaHandle: 7,
} as CompanyResult;

function preencherFormulario(nome = "Maria Silva", documento = "123.456.789-09") {
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: nome } });
  fireEvent.change(screen.getByLabelText("CPF ou CNPJ"), { target: { value: documento } });
}

describe('AddInquilinoPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('submete o payload com o documento normalizado (sem máscara)', async () => {
    criarInquilino.mockResolvedValueOnce({ handle: 1, empresaHandle: 7, nome: "Maria Silva", documento: "12345678909", telefone: null, email: null });

    render(<AddInquilinoPage company={company} />);
    preencherFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar inquilino" }));

    await waitFor(() => {
      expect(criarInquilino).toHaveBeenCalledWith(7, {
        nome: "Maria Silva",
        documento: "12345678909",
        telefone: null,
        email: null,
      });
    });
  });

  it('exibe a mensagem de erro do backend em caso de 409 (documento duplicado)', async () => {
    criarInquilino.mockRejectedValueOnce(new Error("Já existe um inquilino com este documento"));

    render(<AddInquilinoPage company={company} />);
    preencherFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar inquilino" }));

    await waitFor(() => {
      expect(screen.getByText("Já existe um inquilino com este documento")).toBeTruthy();
    });
  });

  it('desabilita o submit enquanto nome ou documento não forem preenchidos', () => {
    render(<AddInquilinoPage company={company} />);
    const botao = screen.getByRole("button", { name: "Cadastrar inquilino" });

    expect(botao.hasAttribute("disabled")).toBe(true);

    preencherFormulario();
    expect(screen.getByRole("button", { name: "Cadastrar inquilino" }).hasAttribute("disabled")).toBe(false);
  });

  it('mostra aviso e não chama a API quando o documento tem checksum inválido', async () => {
    render(<AddInquilinoPage company={company} />);
    preencherFormulario("Maria Silva", "123.456.789-00");

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar inquilino" }));

    await waitFor(() => {
      expect(screen.getByText("Documento inválido — confira o CPF ou CNPJ informado")).toBeTruthy();
    });
    expect(criarInquilino).not.toHaveBeenCalled();
  });
});