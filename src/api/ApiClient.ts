import type { APIRequestContext, APIResponse } from '@playwright/test';
import { e2eConfig } from '../config/environment.js';
import { parseJsonResponse } from '../utils/network.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('api-client');

export type ApiEnvelope<T = unknown> = {
  status: string;
  msg?: string;
  data?: T;
};

export class ApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseUrl: string,
    protected readonly defaultHeaders: Record<string, string> = {},
  ) {}

  protected buildUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUrl}/${normalizedPath}`;
  }

  protected mergeHeaders(headers?: Record<string, string>): Record<string, string> {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...headers,
    };
  }

  async get<T = unknown>(path: string, headers?: Record<string, string>): Promise<{ response: APIResponse; body: T }> {
    const url = this.buildUrl(path);
    const response = await this.request.get(url, {
      headers: this.mergeHeaders(headers),
      timeout: e2eConfig.apiTimeoutMs,
    });
    const body = await parseJsonResponse<T>(response);
    logger.debug('GET', { url, status: response.status() });
    return { response, body };
  }

  async post<T = unknown>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<{ response: APIResponse; body: T }> {
    const url = this.buildUrl(path);
    const response = await this.request.post(url, {
      headers: this.mergeHeaders(headers),
      data,
      timeout: e2eConfig.apiTimeoutMs,
    });
    const body = await parseJsonResponse<T>(response);
    logger.debug('POST', { url, status: response.status() });
    return { response, body };
  }

  async patch<T = unknown>(
    path: string,
    data?: unknown,
    headers?: Record<string, string>,
  ): Promise<{ response: APIResponse; body: T }> {
    const url = this.buildUrl(path);
    const response = await this.request.patch(url, {
      headers: this.mergeHeaders(headers),
      data,
      timeout: e2eConfig.apiTimeoutMs,
    });
    const body = await parseJsonResponse<T>(response);
    logger.debug('PATCH', { url, status: response.status() });
    return { response, body };
  }

  async delete<T = unknown>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<{ response: APIResponse; body: T }> {
    const url = this.buildUrl(path);
    const response = await this.request.delete(url, {
      headers: this.mergeHeaders(headers),
      timeout: e2eConfig.apiTimeoutMs,
    });
    const body = await parseJsonResponse<T>(response);
    logger.debug('DELETE', { url, status: response.status() });
    return { response, body };
  }

  withAuth(accessToken: string): ApiClient {
    return new ApiClient(this.request, this.baseUrl, {
      ...this.defaultHeaders,
      Authorization: `Bearer ${accessToken}`,
    });
  }
}

export function createErpApiClient(request: APIRequestContext): ApiClient {
  return new ApiClient(request, e2eConfig.erp.apiBaseUrl);
}

export function createSuperAdminApiClient(request: APIRequestContext): ApiClient {
  return new ApiClient(request, e2eConfig.superAdmin.apiBaseUrl);
}
