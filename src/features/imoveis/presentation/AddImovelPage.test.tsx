import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CompanyResult } from '@/features/empresas/presentation/CreateCompanyPage';
import { ApiRequestError } from '@/shared/infrastructure/http/http-client';
import { AddImovelPage } from './AddImovelPage';

// jsdom não implementa scrollIntoView/hasPointerCapture, usados pelo Radix Select ao abrir o
// dropdown — sem esses stubs, clicar no combobox de "Tipo" lança TypeError nos testes abaixo.
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

const { criarImovel } = vi.hoisted(() => ({ criarImovel: vi.fn() }));

vi.mock('../infrastructure/imoveis-api', () => ({ criarImovel }));

const company = {
  isEmployee: false,
  companyName: "Empresa Teste",
  empresaHandle: 7,
} as CompanyResult;

async function preencherFormulario(
  endereco = "Rua das Flores, 123",
  tipo = "Apartamento",
  metragem = "75",
  numeroComodos = "4",
) {
  fireEvent.change(screen.getByLabelText("Endereço"), { target: { value: endereco } });
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(await screen.findByRole("option", { name: tipo }));
  fireEvent.change(screen.getByLabelText("Metragem (m²)"), { target: { value: metragem } });
  fireEvent.change(screen.getByLabelText("Número de cômodos"), { target: { value: numeroComodos } });
}

describe('AddImovelPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('cadastra com sucesso e o imóvel fica disponível para a listagem', async () => {
    criarImovel.mockResolvedValueOnce({
      handle: 1,
      empresaHandle: 7,
      endereco: "Rua das Flores, 123",
      tipo: "Apartamento",
      metragem: 75,
      numeroComodos: 4,
    });
    const onCriado = vi.fn();

    render(<AddImovelPage company={company} onCriado={onCriado} />);
    await preencherFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar imóvel" }));

    await waitFor(() => {
      expect(criarImovel).toHaveBeenCalledWith(7, {
        endereco: "Rua das Flores, 123",
        tipo: "Apartamento",
        metragem: 75,
        numeroComodos: 4,
      });
    });
    expect(await screen.findByText(/cadastrado com sucesso/)).toBeTruthy();
    expect(onCriado).toHaveBeenCalled();
  });

  it('desabilita o submit e não chama a API enquanto falta um campo obrigatório', async () => {
    render(<AddImovelPage company={company} />);
    const botao = screen.getByRole("button", { name: "Cadastrar imóvel" });
    expect(botao.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Endereço"), { target: { value: "Rua das Flores, 123" } });
    expect(screen.getByRole("button", { name: "Cadastrar imóvel" }).hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("Metragem (m²)"), { target: { value: "75" } });
    fireEvent.change(screen.getByLabelText("Número de cômodos"), { target: { value: "4" } });
    expect(screen.getByRole("button", { name: "Cadastrar imóvel" }).hasAttribute("disabled")).toBe(true);

    expect(criarImovel).not.toHaveBeenCalled();
  });

  it('mostra aviso e não chama a API quando a metragem informada não é maior que zero', async () => {
    render(<AddImovelPage company={company} />);
    fireEvent.change(screen.getByLabelText("Endereço"), { target: { value: "Rua das Flores, 123" } });
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(await screen.findByRole("option", { name: "Apartamento" }));
    fireEvent.change(screen.getByLabelText("Metragem (m²)"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Número de cômodos"), { target: { value: "4" } });

    expect(screen.getByRole("button", { name: "Cadastrar imóvel" }).hasAttribute("disabled")).toBe(true);
    expect(criarImovel).not.toHaveBeenCalled();
  });

  it('exibe mensagem específica quando a API nega permissão (403)', async () => {
    criarImovel.mockRejectedValueOnce(
      new ApiRequestError("Somente membros da empresa podem gerenciar seus imóveis.", 403),
    );

    render(<AddImovelPage company={company} />);
    await preencherFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar imóvel" }));

    await waitFor(() => {
      expect(screen.getByText("Você não tem permissão para cadastrar imóveis nesta empresa.")).toBeTruthy();
    });
  });

  it('exibe a mensagem de erro do backend para outros erros da API', async () => {
    criarImovel.mockRejectedValueOnce(new Error("Erro inesperado ao cadastrar"));

    render(<AddImovelPage company={company} />);
    await preencherFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar imóvel" }));

    await waitFor(() => {
      expect(screen.getByText("Erro inesperado ao cadastrar")).toBeTruthy();
    });
  });
});
