import type { Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolveFromRoot } from '../config/environment.js';
import { createLogger } from './logger.js';

const logger = createLogger('screenshot');

mkdirSync(resolveFromRoot('screenshots'), { recursive: true });

export async function captureScreenshot(
  page: Page,
  name: string,
  fullPage = true,
): Promise<string> {
  const safeName = name.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
  const path = resolveFromRoot(`screenshots/${safeName}-${Date.now()}.png`);
  await page.screenshot({ path, fullPage });
  logger.info('Screenshot captured', { path });
  return path;
}

export async function captureElementScreenshot(page: Page, selector: string, name: string): Promise<string> {
  const safeName = name.replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
  const path = resolveFromRoot(`screenshots/${safeName}-${Date.now()}.png`);
  await page.locator(selector).screenshot({ path });
  logger.info('Element screenshot captured', { path, selector });
  return path;
}
