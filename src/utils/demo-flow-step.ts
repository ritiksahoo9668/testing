import { test } from '@playwright/test';
import { setLauncherLiveStep } from './launcher-live.js';

/** Playwright test.step that syncs step order/title to the launcher live panel. */
export function demoStep(name: string, fn: () => Promise<void>): Promise<void> {
  const match = name.match(/^(\d+)\.\s+\[[^\]]+\]\s+(.+?)(?:\s+\([^)]*\))?\s*$/);
  if (match) {
    setLauncherLiveStep(Number(match[1]), match[2]!.trim());
  }
  return test.step(name, fn);
}
