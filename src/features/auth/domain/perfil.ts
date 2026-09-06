import type { Usuario } from './usuario';
import type { Empresa } from '@/features/empresas/domain/empresa';

export interface PerfilUsuario extends Usuario {
  empresaDona: Empresa | null;
}
