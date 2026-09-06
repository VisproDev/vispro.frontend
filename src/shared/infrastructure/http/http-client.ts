export const API_BASE = "/api";

export interface ApiError {
  erro: string;
  detalhes?: string[];
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const err: Partial<ApiError> = await res.json().catch(() => ({}));
    throw new Error(err.erro || `Erro na requisição (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}
