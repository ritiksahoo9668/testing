import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';

type ApiEnvelope<T = unknown> = {
  status: string;
  data?: T;
  msg?: string;
};

export type ThinkspaceAgendaRecord = {
  id: number;
  title?: string;
  status?: string;
  start_datetime?: string;
};

export class ThinkspaceAgendaApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly accessToken: string,
  ) {}

  private client() {
    return createErpApiClient(this.request).withAuth(this.accessToken);
  }

  async listAgendas() {
    return this.client().get<ApiEnvelope<{ count?: number; results?: ThinkspaceAgendaRecord[] } | ThinkspaceAgendaRecord[]>>(
      'thinkspace/agendas/',
    );
  }

  async deleteAgenda(id: number) {
    return this.client().delete<ApiEnvelope<unknown>>(`thinkspace/agendas/${id}/`);
  }

  async findAgendaByTitle(title: string): Promise<ThinkspaceAgendaRecord | undefined> {
    const { body } = await this.listAgendas();
    const data = body.data;
    const results = Array.isArray(data) ? data : data?.results ?? [];
    return results.find((a) => a.title === title);
  }
}

export function createThinkspaceAgendaApi(
  request: APIRequestContext,
  accessToken: string,
): ThinkspaceAgendaApi {
  return new ThinkspaceAgendaApi(request, accessToken);
}
