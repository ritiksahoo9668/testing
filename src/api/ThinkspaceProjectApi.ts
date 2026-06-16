import type { APIRequestContext } from '@playwright/test';
import { createErpApiClient } from './ApiClient.js';

type ApiEnvelope<T = unknown> = {
  status: string;
  data?: T;
  msg?: string;
};

export type StatutoryApprovalsMeta = Record<
  string,
  { enabled: boolean; remarks: string }
>;

export type ProjectActionItem = {
  name: string;
  owner_id: number;
  owner_name?: string;
  priority?: string;
  due_date?: string;
  remarks?: string;
  converted?: boolean;
  task_id?: number;
};

export type ThinkspaceProjectRecord = {
  id: number;
  title?: string;
  status?: string;
  workflow_stage?: string;
  company?: number;
  project_owner?: number;
  estimated_cost?: string | number | null;
  statutory_approval_required?: boolean;
  statutory_approvals_meta?: StatutoryApprovalsMeta;
  action_items?: ProjectActionItem[];
  description?: string;
};

export type ThinkspaceProjectCreatePayload = {
  title: string;
  status?: string;
  project_nature?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
  company?: number;
  project_owner?: number;
  estimated_cost?: number | null;
  duration_days?: number | null;
  statutory_approval_required?: boolean;
  statutory_approvals_meta?: StatutoryApprovalsMeta;
  team_meta?: Record<string, unknown>;
  action_items?: ProjectActionItem[];
  workflow_stage?: string;
  workflow_history?: unknown[];
};

function extractProjectList(body: ApiEnvelope<ThinkspaceProjectRecord[] | { results?: ThinkspaceProjectRecord[] }>): ThinkspaceProjectRecord[] {
  const data = body.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { results?: ThinkspaceProjectRecord[] }).results)) {
    return (data as { results: ThinkspaceProjectRecord[] }).results;
  }
  return [];
}

function extractProject(body: ApiEnvelope<ThinkspaceProjectRecord>): ThinkspaceProjectRecord {
  const project = body.data;
  if (!project?.id) {
    throw new Error(`Project id missing in response: ${JSON.stringify(body).slice(0, 240)}`);
  }
  return project;
}

export class ThinkspaceProjectApi {
  constructor(
    private readonly request: APIRequestContext,
    private readonly accessToken: string,
  ) {}

  private client() {
    return createErpApiClient(this.request).withAuth(this.accessToken);
  }

  async listProjects() {
    return this.client().get<ApiEnvelope<ThinkspaceProjectRecord[]>>('thinkspace/projects/');
  }

  async getProject(projectId: number) {
    return this.client().get<ApiEnvelope<ThinkspaceProjectRecord>>(`thinkspace/projects/${projectId}/`);
  }

  async createProject(payload: ThinkspaceProjectCreatePayload) {
    return this.client().post<ApiEnvelope<ThinkspaceProjectRecord>>('thinkspace/projects/', payload);
  }

  async patchProject(projectId: number, payload: Partial<ThinkspaceProjectCreatePayload>) {
    return this.client().patch<ApiEnvelope<ThinkspaceProjectRecord>>(`thinkspace/projects/${projectId}/`, payload);
  }

  async deleteProject(projectId: number) {
    return this.client().delete<ApiEnvelope<unknown>>(`thinkspace/projects/${projectId}/`);
  }

  extractProjectId(body: ApiEnvelope<ThinkspaceProjectRecord>): number {
    return extractProject(body).id;
  }

  async findProjectByTitle(title: string): Promise<ThinkspaceProjectRecord | undefined> {
    const { body } = await this.listProjects();
    return extractProjectList(body).find((p) => p.title === title);
  }
}

export function createThinkspaceProjectApi(
  request: APIRequestContext,
  accessToken: string,
): ThinkspaceProjectApi {
  return new ThinkspaceProjectApi(request, accessToken);
}
