import { loginKeycloak, buscarPerfilAtual } from '../infrastructure/auth-api';
import type { PerfilUsuario } from '../domain/perfil';

/** Caso de uso: autentica no Keycloak e busca o perfil (com a empresa da qual é dono, se houver). */
export async function autenticarUsuario(email: string, senha: string): Promise<PerfilUsuario> {
  const token = await loginKeycloak(email, senha);
  return buscarPerfilAtual(token);
}
