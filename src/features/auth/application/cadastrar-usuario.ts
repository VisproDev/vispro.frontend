import { criarConta, loginKeycloak } from '../infrastructure/auth-api';
import type { CriarContaInput } from '../infrastructure/auth-api';
import type { Usuario } from '../domain/usuario';

/** Caso de uso: cria a conta do usuário e já autentica no Keycloak em seguida. */
export async function cadastrarEAutenticar(data: CriarContaInput): Promise<Usuario> {
  const usuario = await criarConta(data);
  await loginKeycloak(data.email, data.senha);
  return usuario;
}
