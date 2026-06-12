import type { Page } from '@playwright/test';
import { e2eConfig } from '../config/environment.js';
import { createLogger } from './logger.js';

const logger = createLogger('performance');

export type PerformanceMeasurement = {
  label: string;
  durationMs: number;
  thresholdMs: number;
  passed: boolean;
};

export async function measureNavigation(page: Page, url: string, label = 'navigation'): Promise<PerformanceMeasurement> {
  const started = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const durationMs = Date.now() - started;
  const thresholdMs = e2eConfig.perf.navigationMs;
  const passed = durationMs <= thresholdMs;

  logger.info('Navigation performance', { label, durationMs, thresholdMs, passed });
  return { label, durationMs, thresholdMs, passed };
}

export async function measureAction<T>(
  label: string,
  action: () => Promise<T>,
  thresholdMs = e2eConfig.perf.apiMs,
): Promise<{ result: T; measurement: PerformanceMeasurement }> {
  const started = Date.now();
  const result = await action();
  const durationMs = Date.now() - started;
  const passed = durationMs <= thresholdMs;

  logger.info('Action performance', { label, durationMs, thresholdMs, passed });
  return {
    result,
    measurement: { label, durationMs, thresholdMs, passed },
  };
}

export function attachPerformanceObserver(page: Page): void {
  page.on('load', async () => {
    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      if (!nav) return null;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        loadEvent: nav.loadEventEnd - nav.startTime,
        transferSize: nav.transferSize,
      };
    });

    if (metrics) {
      logger.debug('Browser navigation metrics', metrics);
    }
  });
}
