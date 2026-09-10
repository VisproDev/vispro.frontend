import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { getToken } from '@/shared/infrastructure/storage/token-storage';
import type { CriarInquilinoInput, Inquilino } from '../domain/inquilino';

/** POST /api/empresas/:empresaHandle/inquilinos — cadastra um inquilino. */
export async function criarInquilino(
  empresaHandle: number,
  data: CriarInquilinoInput,
): Promise<Inquilino> {
  return apiRequest<Inquilino>(`/empresas/${empresaHandle}/inquilinos`, {
    method: "POST",
    body: JSON.stringify(data),
  }, getToken());
}

/** GET /api/empresas/:empresaHandle/inquilinos — lista os inquilinos da empresa. */
export async function listarInquilinos(empresaHandle: number): Promise<Inquilino[]> {
  return apiRequest<Inquilino[]>(`/empresas/${empresaHandle}/inquilinos`, {
    method: "GET",
  }, getToken());
}