import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { getToken } from '@/shared/infrastructure/storage/token-storage';
import type { CriarImovelInput, Imovel } from '../domain/imovel';

/** POST /api/empresas/:empresaHandle/imoveis — cadastra um imóvel. */
export async function criarImovel(
  empresaHandle: number,
  data: CriarImovelInput,
): Promise<Imovel> {
  return apiRequest<Imovel>(`/empresas/${empresaHandle}/imoveis`, {
    method: "POST",
    body: JSON.stringify(data),
  }, getToken());
}

/** GET /api/empresas/:empresaHandle/imoveis — lista os imóveis da empresa. */
export async function listarImoveis(empresaHandle: number): Promise<Imovel[]> {
  return apiRequest<Imovel[]>(`/empresas/${empresaHandle}/imoveis`, {
    method: "GET",
  }, getToken());
}
