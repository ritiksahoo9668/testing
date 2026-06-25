import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';
import type { ThinkspaceTaskPayload } from '../data/thinkspace/task-factory.js';
import { getUserIdFromAccessToken } from '../utils/jwt.js';

type ApiEnvelope<T = unknown> = {
  status: string;
  data?: T;
  msg?: string;
};

export type ThinkspaceTaskRecord = {
  id: number;
  task_title?: string;
  progress_percentage?: number;
  status?: string;
  task_details?: string;
  priority?: string;
};

export class ThinkspaceTaskApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly accessToken: string,
  ) {}

  private client() {
    return createErpApiClient(this.request).withAuth(this.accessToken);
  }

  async getCurrentUserId(): Promise<number> {
    const fromToken = getUserIdFromAccessToken(this.accessToken);
    if (fromToken) return fromToken;
    throw new Error('Could not resolve current user id from JWT');
  }

  async listTasks(queryParams?: Record<string, string>) {
    const query = queryParams ? `?${new URLSearchParams(queryParams).toString()}` : '';
    return this.client().get<ApiEnvelope<{ count?: number; results?: ThinkspaceTaskRecord[] }>>(
      `thinkspace/tasks/${query}`,
    );
  }

  async getTask(taskId: string | number) {
    return this.client().get<ApiEnvelope<ThinkspaceTaskRecord>>(`thinkspace/tasks/${taskId}/`);
  }

  async createTask(payload: ThinkspaceTaskPayload) {
    return this.client().post<ApiEnvelope<ThinkspaceTaskRecord>>('thinkspace/tasks/', payload);
  }

  async patchTask(taskId: number, payload: Record<string, unknown>) {
    return this.client().patch<ApiEnvelope<ThinkspaceTaskRecord>>(`thinkspace/tasks/${taskId}/`, payload);
  }

  async setProgress(taskId: number, progress: number, extra: Record<string, unknown> = {}) {
    return this.client().post<ApiEnvelope<unknown>>('thinkspace/tasks/set-task-progress/', {
      task_id: taskId,
      progress_percentage: progress,
      ...extra,
    });
  }

  async deleteTask(taskId: number) {
    return this.client().post<ApiEnvelope<unknown>>('thinkspace/tasks/delete-task/', {
      task_id: taskId,
    });
  }

  async createBucketItem(payload: { title: string; description?: string; status?: string }) {
    return this.client().post<ApiEnvelope<{ id: number; title: string }>>('thinkspace/bucket-list/', payload);
  }

  async deleteBucketItem(id: number) {
    return this.client().delete<ApiEnvelope<unknown>>(`thinkspace/bucket-list/${id}/`);
  }

  extractTaskId(body: ApiEnvelope<ThinkspaceTaskRecord>): number {
    const id = body.data?.id;
    if (!id) throw new Error(`Task id missing in response: ${JSON.stringify(body).slice(0, 200)}`);
    return Number(id);
  }

  async findTaskByTitle(title: string): Promise<ThinkspaceTaskRecord | undefined> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const { body } = await this.listTasks({ limit: '200', start: '0' });
        const results = body.data?.results ?? [];
        const found = results.find((t) => t.task_title === title);
        if (found) return found;
      } catch {
        return undefined;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return undefined;
  }
}

export function createThinkspaceTaskApi(
  request: APIRequestContext,
  accessToken: string,
): ThinkspaceTaskApi {
  return new ThinkspaceTaskApi(request, accessToken);
}
