/** Pacote de tokens de uma sessão autenticada no Keycloak. */
export interface SessaoTokens {
  accessToken: string;
  refreshToken: string;
  /** epoch ms, calculado no cliente = Date.now() + expires_in*1000 */
  accessTokenExpiraEm: number;
  /** epoch ms, calculado no cliente = Date.now() + refresh_expires_in*1000 */
  refreshTokenExpiraEm: number;
}
