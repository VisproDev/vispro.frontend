import type { Usuario } from './usuario';

export interface ContaAutenticada extends Usuario {
  name: string;
  color: string;
  key: string;
}
