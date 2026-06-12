import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { e2eConfig } from '../config/environment.js';

export type AuthTokens = {
  access: string;
  refresh?: string;
};

export type ErpSessionState = {
  accessToken: string;
  refreshToken: string | null;
  username: string | null;
};

const ERP_STORAGE_KEY = 'dyly-session';

export function saveJsonFile(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
}

export function readJsonFile<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

export function buildPlaywrightStorageState(tokens: AuthTokens, origin: string, username?: string) {
  const session: ErpSessionState = {
    accessToken: tokens.access,
    refreshToken: tokens.refresh ?? null,
    username: username ?? null,
  };

  return {
    cookies: [],
    origins: [
      {
        origin,
        localStorage: [
          {
            name: ERP_STORAGE_KEY,
            value: JSON.stringify({
              state: session,
              version: 0,
            }),
          },
        ],
      },
    ],
  };
}

export function getErpAuthStoragePath(): string {
  return e2eConfig.erp.authStorageStatePath;
}

export function getSuperAdminAuthStoragePath(): string {
  return e2eConfig.superAdmin.authStorageStatePath;
}

export function authStorageExists(): boolean {
  return existsSync(getErpAuthStoragePath());
}
