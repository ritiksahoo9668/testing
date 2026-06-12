import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';

type HealthEnvelope = {
  status: string;
  data?: {
    ok: boolean;
    checks: Record<string, string>;
  };
};

export class ErpHealthApi {
  constructor(private readonly request: APIRequestContext) {}

  async getHealth() {
    const client = createErpApiClient(this.request);
    return client.get<HealthEnvelope>('health/');
  }
}

export function createErpHealthApi(request: APIRequestContext): ErpHealthApi {
  return new ErpHealthApi(request);
}
