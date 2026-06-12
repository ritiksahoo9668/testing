import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';
import type { AuthTokens } from '../utils/storage.js';

type TokenEnvelope = {
  status: string;
  data?: {
    access?: string;
    refresh?: string;
  };
};

export class ErpAuthApi {
  constructor(private readonly request: APIRequestContext) {}

  async obtainToken(username: string, password: string): Promise<AuthTokens> {
    const client = createErpApiClient(this.request);
    const { response, body } = await client.post<TokenEnvelope>('auth/token/', {
      username,
      password,
    });

    if (!response.ok()) {
      throw new Error(`ERP token obtain failed with status ${response.status()}`);
    }

    const access = body.data?.access;
    const refresh = body.data?.refresh;

    if (!access) {
      throw new Error('ERP token response missing access token');
    }

    return { access, refresh };
  }

  async refreshToken(refresh: string): Promise<AuthTokens> {
    const client = createErpApiClient(this.request);
    const { response, body } = await client.post<TokenEnvelope>('auth/token/refresh/', { refresh });

    if (!response.ok()) {
      throw new Error(`ERP token refresh failed with status ${response.status()}`);
    }

    const access = body.data?.access;
    if (!access) {
      throw new Error('ERP refresh response missing access token');
    }

    return { access, refresh: body.data?.refresh ?? refresh };
  }

  async verifyToken(token: string): Promise<boolean> {
    const client = createErpApiClient(this.request);
    const { response } = await client.post('auth/token/verify/', { token });
    return response.ok();
  }
}

export function createErpAuthApi(request: APIRequestContext): ErpAuthApi {
  return new ErpAuthApi(request);
}
