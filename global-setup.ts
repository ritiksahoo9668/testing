import type { FullConfig } from '@playwright/test';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { e2eConfig, resolveFromRoot } from './src/config/environment.js';
import { createLogger } from './src/utils/logger.js';

const logger = createLogger('global-setup');

function cleanAllureResults(): void {
  const resultsDir = resolveFromRoot('allure-results');
  if (!existsSync(resultsDir)) {
    return;
  }

  try {
    rmSync(resultsDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch (error) {
    logger.warn('Could not remove allure-results; retrying file-by-file', { error });
    for (const name of readdirSync(resultsDir)) {
      if (name === 'categories.json') continue;
      rmSync(join(resultsDir, name), { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    }
  }
}

async function ensureDirectories(): Promise<void> {
  const dirs = [
    'playwright-report',
    'reports/json',
    'reports/junit',
    'allure-results',
    'MaithanErp',
    'storage',
    'logs',
    'screenshots',
    'videos',
    'traces',
  ];

  for (const dir of dirs) {
    mkdirSync(resolveFromRoot(dir), { recursive: true });
  }

  cleanAllureResults();
  mkdirSync(resolveFromRoot('allure-results'), { recursive: true });

  const categoriesSource = resolveFromRoot('config/allure-categories.json');
  const categoriesTarget = resolveFromRoot('allure-results/categories.json');
  if (existsSync(categoriesSource)) {
    copyFileSync(categoriesSource, categoriesTarget);
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  await ensureDirectories();

  logger.info('Playwright global setup complete', {
    environment: e2eConfig.env,
    erpUiBaseUrl: e2eConfig.erp.uiBaseUrl,
    erpApiBaseUrl: e2eConfig.erp.apiBaseUrl,
    skipGlobalSetup: e2eConfig.skipGlobalSetup,
    headless: e2eConfig.headless,
    workers: e2eConfig.workers ?? 'auto',
    retries: e2eConfig.retries,
  });
}
