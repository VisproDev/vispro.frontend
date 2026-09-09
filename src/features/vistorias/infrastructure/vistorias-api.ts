import { apiRequest } from '@/shared/infrastructure/http/http-client';
import { getToken } from '@/shared/infrastructure/storage/token-storage';
import type { AgendarVistoriaInput, ListarVistoriasParams, PaginaVistorias, Vistoria } from '../domain/vistoria';

/** POST /api/empresas/:empresaHandle/vistorias — agenda uma vistoria. Qualquer membro da empresa. */
export async function agendarVistoria(empresaHandle: number, data: AgendarVistoriaInput): Promise<Vistoria> {
  return apiRequest<Vistoria>(`/empresas/${empresaHandle}/vistorias`, {
    method: "POST",
    body: JSON.stringify(data),
  }, getToken());
}

/** GET /api/empresas/:empresaHandle/vistorias — lista paginada, filtrável por status/tipo/endereço/vistoriador. */
export async function listarVistorias(
  empresaHandle: number,
  params: ListarVistoriasParams = {},
): Promise<PaginaVistorias> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.tipo) query.set("tipo", params.tipo);
  if (params.endereco) query.set("endereco", params.endereco);
  if (params.vistoriadorHandle != null) query.set("vistoriadorHandle", String(params.vistoriadorHandle));
  if (params.pagina) query.set("pagina", String(params.pagina));
  if (params.tamanhoPagina) query.set("tamanhoPagina", String(params.tamanhoPagina));

  const qs = query.toString();
  return apiRequest<PaginaVistorias>(
    `/empresas/${empresaHandle}/vistorias${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    getToken(),
  );
}

/** PUT /api/empresas/:empresaHandle/vistorias/:vistoriaHandle — atualiza uma vistoria existente. */
export async function atualizarVistoria(
  empresaHandle: number,
  vistoriaHandle: number,
  data: AgendarVistoriaInput,
): Promise<Vistoria> {
  return apiRequest<Vistoria>(`/empresas/${empresaHandle}/vistorias/${vistoriaHandle}`, {
    method: "PUT",
    body: JSON.stringify(data),
  }, getToken());
}
