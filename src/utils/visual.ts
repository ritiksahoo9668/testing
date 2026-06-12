import { expect, type Page } from '@playwright/test';
import { resolveFromRoot } from '../config/environment.js';

export type VisualSnapshotOptions = {
  name: string;
  maxDiffPixelRatio?: number;
  animations?: 'disabled' | 'allow';
  fullPage?: boolean;
};

/**
 * Foundation for visual regression. Baseline images are stored under tests/visual-baselines/.
 * Run with `--update-snapshots` to seed baselines once UI is stable.
 */
export async function expectVisualSnapshot(
  page: Page,
  options: VisualSnapshotOptions,
): Promise<void> {
  const snapshotName = `${options.name}.png`;

  await expect(page).toHaveScreenshot(snapshotName, {
    maxDiffPixelRatio: options.maxDiffPixelRatio ?? 0.02,
    animations: options.animations ?? 'disabled',
    fullPage: options.fullPage ?? false,
  });
}

export function visualBaselinePath(name: string): string {
  return resolveFromRoot(`tests/visual-baselines/${name}.png`);
}
