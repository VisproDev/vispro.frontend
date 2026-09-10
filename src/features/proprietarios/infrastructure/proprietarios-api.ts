import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { getToken } from '@/shared/infrastructure/storage/token-storage';
import type { CriarProprietarioInput, Proprietario } from '../domain/proprietario';

/** POST /api/empresas/:empresaHandle/proprietarios — cadastra um proprietário. */
export async function criarProprietario(
  empresaHandle: number,
  data: CriarProprietarioInput,
): Promise<Proprietario> {
  return apiRequest<Proprietario>(`/empresas/${empresaHandle}/proprietarios`, {
    method: "POST",
    body: JSON.stringify(data),
  }, getToken());
}

/** GET /api/empresas/:empresaHandle/proprietarios — lista os proprietários da empresa. */
export async function listarProprietarios(empresaHandle: number): Promise<Proprietario[]> {
  return apiRequest<Proprietario[]>(`/empresas/${empresaHandle}/proprietarios`, {
    method: "GET",
  }, getToken());
}
