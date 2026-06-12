import { defineConfig } from '@playwright/test';
import { browserProjects } from './src/config/projects.js';
import { e2eConfig, resolveFromRoot } from './src/config/environment.js';
import { buildReporters } from './src/config/reporters.js';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: e2eConfig.isCI,
  retries: e2eConfig.retries,
  workers: 1,
  timeout: e2eConfig.timeoutMs,
  expect: {
    timeout: 10_000,
  },
  outputDir: resolveFromRoot('test-results'),
  globalSetup: resolveFromRoot('global-setup.ts'),
  globalTeardown: resolveFromRoot('global-teardown.ts'),
  reporter: buildReporters(),
  use: {
    headless: e2eConfig.headless,
    baseURL: e2eConfig.erp.uiBaseUrl,
    trace: e2eConfig.trace,
    video: e2eConfig.video,
    screenshot: e2eConfig.screenshot,
    actionTimeout: e2eConfig.actionTimeoutMs,
    navigationTimeout: e2eConfig.navigationTimeoutMs,
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
    launchOptions: {
      slowMo: e2eConfig.slowMo,
    },
  },
  projects: browserProjects,
  metadata: {
    environment: e2eConfig.env,
    erpUiBaseUrl: e2eConfig.erp.uiBaseUrl,
    erpApiBaseUrl: e2eConfig.erp.apiBaseUrl,
  },
});
