import type { Page } from '@playwright/test';

/** Pause between demo steps so headed video captures each UI state clearly. */
const DEFAULT_MS = Number(process.env.E2E_DEMO_PAUSE_MS ?? 1_200);

export function demoPauseMs(): number {
  return Number.isFinite(DEFAULT_MS) && DEFAULT_MS > 0 ? DEFAULT_MS : 0;
}

export async function demoPause(page: Page, ms?: number): Promise<void> {
  const delay = ms ?? demoPauseMs();
  if (delay <= 0) return;
  await page.waitForTimeout(delay);
}
