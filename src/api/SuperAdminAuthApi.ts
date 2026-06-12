import type { APIRequestContext } from '@playwright/test';
import { createSuperAdminApiClient } from './ApiClient.js';

type SuperAdminLoginResponse = {
  access?: string;
  refresh?: string;
  data?: {
    access?: string;
    refresh?: string;
  };
};

export class SuperAdminAuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async login(username: string, password: string) {
    const client = createSuperAdminApiClient(this.request);
    const { response, body } = await client.post<SuperAdminLoginResponse>('auth/login/', {
      username,
      password,
    });

    if (!response.ok()) {
      throw new Error(`Super Admin login failed with status ${response.status()}`);
    }

    const access = body.access ?? body.data?.access;
    const refresh = body.refresh ?? body.data?.refresh;

    if (!access) {
      throw new Error('Super Admin login response missing access token');
    }

    return { access, refresh };
  }
}

export function createSuperAdminAuthApi(request: APIRequestContext): SuperAdminAuthApi {
  return new SuperAdminAuthApi(request);
}
