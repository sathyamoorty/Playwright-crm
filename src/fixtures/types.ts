/** Credentials used by the auth fixture (override via env in CI). */
export interface AuthCredentials {
  tenant: string;
  username: string;
  password: string;
}

export const DEFAULT_AUTH_CREDENTIALS: AuthCredentials = {
  tenant: process.env.PW_TENANT ?? 'RSAUTOMATION',
  username: process.env.PW_USER ?? 'rsoft',
  password: process.env.PW_PASSWORD ?? 'RSoft@2026',
};
