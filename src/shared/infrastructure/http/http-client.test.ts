import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./http-client";

function mockFetchResponse(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("apiRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("propaga mensagem de erro quando detalhes são strings", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse(400, { erro: "Dados inválidos", detalhes: ["email inválido"] }),
    );

    await expect(apiRequest("/qualquer")).rejects.toThrow("Dados inválidos email inválido");
  });

  it("extrai a mensagem quando detalhes vêm como issues do zod (objetos)", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchResponse(400, {
        erro: "Dados inválidos",
        detalhes: [{ code: "invalid_string", message: "email inválido", path: ["email"] }],
      }),
    );

    await expect(apiRequest("/qualquer")).rejects.toThrow("Dados inválidos email inválido");
  });

  it("cai para a mensagem genérica quando detalhes não têm formato reconhecido", async () => {
    vi.stubGlobal("fetch", mockFetchResponse(400, { erro: "Dados inválidos", detalhes: [{}] }));

    await expect(apiRequest("/qualquer")).rejects.toThrow("Dados inválidos");
  });
});
