import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';

type LiveProgress = {
  currentStep: number;
  title: string;
  url: string;
  completedSteps: number[];
  state: 'running' | 'passed' | 'failed';
};

const liveMeta: LiveProgress = {
  currentStep: 0,
  title: '',
  url: '',
  completedSteps: [],
  state: 'running',
};

function liveDir(): string | undefined {
  const dir = process.env.E2E_LAUNCHER_LIVE_DIR?.trim();
  return dir || undefined;
}

function writeProgressFile(): void {
  const dir = liveDir();
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'progress.json'), JSON.stringify(liveMeta, null, 0));
}

export function resetLauncherLive(): void {
  liveMeta.currentStep = 0;
  liveMeta.title = '';
  liveMeta.url = '';
  liveMeta.completedSteps = [];
  liveMeta.state = 'running';
  writeProgressFile();
}

export function setLauncherLiveStep(order: number, title: string): void {
  if (!liveDir()) return;
  liveMeta.currentStep = order;
  liveMeta.title = title;
  writeProgressFile();
}

export function finishLauncherLive(state: 'passed' | 'failed'): void {
  if (!liveDir()) return;
  liveMeta.state = state;
  writeProgressFile();
}

export async function captureLauncherLive(page: Page): Promise<void> {
  const dir = liveDir();
  if (!dir) return;

  mkdirSync(dir, { recursive: true });
  liveMeta.url = page.url();

  if (liveMeta.currentStep > 0 && !liveMeta.completedSteps.includes(liveMeta.currentStep)) {
    liveMeta.completedSteps.push(liveMeta.currentStep);
    liveMeta.completedSteps.sort((a, b) => a - b);
  }

  await page.screenshot({ path: join(dir, 'frame.png'), fullPage: false, animations: 'disabled' });
  writeProgressFile();
}
