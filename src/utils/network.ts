import type { APIRequestContext, APIResponse, Page, Request, Response } from '@playwright/test';
import { createLogger } from './logger.js';

const logger = createLogger('network');

export type CapturedRequest = {
  method: string;
  url: string;
  status?: number;
  startedAt: number;
  durationMs?: number;
};

export class NetworkMonitor {
  private readonly requests: CapturedRequest[] = [];

  constructor(private readonly page: Page) {}

  attach(): void {
    this.page.on('request', (request: Request) => {
      this.requests.push({
        method: request.method(),
        url: request.url(),
        startedAt: Date.now(),
      });
    });

    this.page.on('response', (response: Response) => {
      const url = response.url();
      const match = [...this.requests].reverse().find((entry) => entry.url === url && !entry.status);
      if (match) {
        match.status = response.status();
        match.durationMs = Date.now() - match.startedAt;
      }
    });
  }

  getRequests(filter?: string | RegExp): CapturedRequest[] {
    if (!filter) return [...this.requests];
    return this.requests.filter((entry) =>
      typeof filter === 'string' ? entry.url.includes(filter) : filter.test(entry.url),
    );
  }

  logSummary(filter?: string | RegExp): void {
    const entries = this.getRequests(filter);
    logger.info('Network summary', { count: entries.length, entries });
  }
}

export async function parseJsonResponse<T = unknown>(response: APIResponse): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON response but received: ${text.slice(0, 200)}`);
  }
}

export async function assertResponseTime(
  startedAt: number,
  maxMs: number,
  label = 'API response',
): Promise<void> {
  const durationMs = Date.now() - startedAt;
  if (durationMs > maxMs) {
    throw new Error(`${label} exceeded ${maxMs}ms (actual ${durationMs}ms)`);
  }
}

export function createApiMonitor(request: APIRequestContext) {
  return {
    async get(path: string, options?: Parameters<APIRequestContext['get']>[1]) {
      const started = Date.now();
      const response = await request.get(path, options);
      logger.debug('API GET', { path, status: response.status(), durationMs: Date.now() - started });
      return response;
    },
    async post(path: string, options?: Parameters<APIRequestContext['post']>[1]) {
      const started = Date.now();
      const response = await request.post(path, options);
      logger.debug('API POST', { path, status: response.status(), durationMs: Date.now() - started });
      return response;
    },
  };
}
