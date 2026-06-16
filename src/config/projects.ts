import type { Project } from '@playwright/test';
import { devices } from '@playwright/test';
import { e2eConfig } from './environment.js';

const sharedUse = {
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
};

/** UI-only browser projects for Thinkspace Actions workflow tests. */
export const browserProjects: Project[] = [
  {
    name: 'chromium-login-guest',
    grep: /@login/,
    grepInvert: /@authenticated/,
    testMatch: /auth\/login\/.*\.ui\.spec\.ts/,
    use: {
      ...sharedUse,
      ...devices['Desktop Chrome'],
      // Capture evidence when field-validation assertions fail (missing inline mobile error).
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      trace: 'retain-on-failure',
    },
  },
  {
    name: 'chromium-guest',
    grep: /@unauthenticated/,
    grepInvert: /@authenticated|@login/,
    testMatch: /thinkspace\/(workflow|projects)\/.*\.ui\.spec\.ts/,
    use: {
      ...sharedUse,
      ...devices['Desktop Chrome'],
    },
  },
  {
    name: 'setup-erp-auth',
    testMatch: /.*\.setup\.ts/,
    use: {
      ...devices['Desktop Chrome'],
      baseURL: e2eConfig.erp.uiBaseUrl,
    },
  },
  {
    name: 'erp-authenticated',
    dependencies: ['setup-erp-auth'],
    grep: /@thinkspace/,
    grepInvert: /@unauthenticated|@demo/,
    testMatch: /thinkspace\/(workflow|projects)\/.*\.ui\.spec\.ts/,
    use: {
      ...sharedUse,
      ...devices['Desktop Chrome'],
      storageState: e2eConfig.erp.authStorageStatePath,
    },
  },
  {
    name: 'thinkspace-demo',
    dependencies: ['setup-erp-auth'],
    grep: /@demo/,
    testMatch: /thinkspace\/demo\/.*\.ui\.spec\.ts/,
    use: {
      ...sharedUse,
      ...devices['Desktop Chrome'],
      storageState: e2eConfig.erp.authStorageStatePath,
      video: 'on',
      trace: 'on',
      screenshot: 'on',
      launchOptions: {
        slowMo: e2eConfig.slowMo > 0 ? e2eConfig.slowMo : 400,
      },
    },
  },
];
