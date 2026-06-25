import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';

type ApiEnvelope<T = unknown> = {
  status: string;
  data?: T;
  msg?: string;
};

export type TravelRequestLeg = {
  from_location?: string;
  to_location?: string;
  travel_date?: string;
  mode?: string;
};

export type TravelRequestRecord = {
  id: number;
  title?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  notes?: string;
  legs?: TravelRequestLeg[];
};

export type TravelRequestCreatePayload = {
  title: string;
  destination: string;
  start_date: string;
  end_date: string;
  notes?: string;
  legs?: TravelRequestLeg[];
};

export type ExpenseClaimRecord = {
  id: number;
  status?: string;
  travel_request?: number;
};

function extractTravelList(
  body: ApiEnvelope<TravelRequestRecord[] | { count?: number; results?: TravelRequestRecord[] }>,
): TravelRequestRecord[] {
  const data = body.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { results?: TravelRequestRecord[] }).results)) {
    return (data as { results: TravelRequestRecord[] }).results;
  }
  return [];
}

function extractTravel(body: ApiEnvelope<TravelRequestRecord>): TravelRequestRecord {
  const row = body.data;
  if (!row?.id) {
    throw new Error(`Travel request id missing in response: ${JSON.stringify(body).slice(0, 240)}`);
  }
  return row;
}

function extractExpenseList(
  body: ApiEnvelope<ExpenseClaimRecord[] | { count?: number; results?: ExpenseClaimRecord[] }>,
): ExpenseClaimRecord[] {
  const data = body.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { results?: ExpenseClaimRecord[] }).results)) {
    return (data as { results: ExpenseClaimRecord[] }).results;
  }
  return [];
}

const TERMINAL_STATUSES = new Set(['Cancelled', 'Completed', 'Rejected']);

export class ThinkspaceTravelApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly accessToken: string,
  ) {}

  private client() {
    return createErpApiClient(this.request).withAuth(this.accessToken);
  }

  async listTravelRequests(params: { status?: string; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.limit) query.set('limit', String(params.limit));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return this.client().get<ApiEnvelope<{ count?: number; results?: TravelRequestRecord[] }>>(
      `thinkspace/travel/requests/${suffix}`,
    );
  }

  async getTravelRequest(id: number) {
    return this.client().get<ApiEnvelope<TravelRequestRecord>>(`thinkspace/travel/requests/${id}/`);
  }

  async createTravelRequest(payload: TravelRequestCreatePayload) {
    return this.client().post<ApiEnvelope<TravelRequestRecord>>('thinkspace/travel/requests/', payload);
  }

  async travelRequestAction(id: number, action: 'submit' | 'approve' | 'reject' | 'cancel', extra: Record<string, unknown> = {}) {
    return this.client().post<ApiEnvelope<TravelRequestRecord>>(`thinkspace/travel/requests/${id}/`, {
      action,
      ...extra,
    });
  }

  extractTravelId(body: ApiEnvelope<TravelRequestRecord>): number {
    return extractTravel(body).id;
  }

  async findTravelByTitle(title: string): Promise<TravelRequestRecord | undefined> {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const { body } = await this.listTravelRequests({ limit: 200 });
      const found = extractTravelList(body).find((r) => r.title === title);
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    return undefined;
  }

  async findExpenseClaimForTravel(travelId: number): Promise<ExpenseClaimRecord | undefined> {
    const { body } = await this.client().get<
      ApiEnvelope<ExpenseClaimRecord[] | { results?: ExpenseClaimRecord[] }>
    >('thinkspace/expense/claims/?limit=200');
    return extractExpenseList(body).find((c) => c.travel_request === travelId);
  }

  /** Best-effort cleanup: cancel non-terminal requests (no delete API). */
  async cancelIfActive(id: number): Promise<void> {
    try {
      const { body } = await this.getTravelRequest(id);
      const status = body.data?.status ?? '';
      if (!TERMINAL_STATUSES.has(status)) {
        await this.travelRequestAction(id, 'cancel');
      }
    } catch {
      /* best effort */
    }
  }
}

export function createThinkspaceTravelApi(
  request: APIRequestContext,
  accessToken: string,
): ThinkspaceTravelApi {
  return new ThinkspaceTravelApi(request, accessToken);
}
