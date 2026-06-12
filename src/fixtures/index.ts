import { test as base, expect } from '@playwright/test';
import { createLoginPage } from '../pages/auth/LoginPage.js';
import { createAppShellPage } from '../pages/common/AppShellPage.js';
import { createTaskPage } from '../pages/thinkspace/TaskPage.js';
import { createTaskDetailModal } from '../pages/thinkspace/TaskDetailModal.js';
import { createQuickCreateModal } from '../pages/thinkspace/QuickCreateModal.js';
import { createErpAuthApi } from '../api/ErpAuthApi.js';
import { createErpHealthApi } from '../api/ErpHealthApi.js';
import { createSuperAdminAuthApi } from '../api/SuperAdminAuthApi.js';
import { createErpApiClient } from '../api/ApiClient.js';
import { createThinkspaceTaskApi } from '../api/ThinkspaceTaskApi.js';
import { createThinkspaceAgendaApi } from '../api/ThinkspaceAgendaApi.js';
import { getErpCredentials } from '../utils/credentials.js';
import {
  authStorageExists,
  buildPlaywrightStorageState,
  getErpAuthStoragePath,
  saveJsonFile,
} from '../utils/storage.js';
import { e2eConfig, hasErpCredentials } from '../config/environment.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-fixture');

type AuthFixtures = {
  loginPage: ReturnType<typeof createLoginPage>;
  appShell: ReturnType<typeof createAppShellPage>;
  taskPage: ReturnType<typeof createTaskPage>;
  taskDetailModal: ReturnType<typeof createTaskDetailModal>;
  quickCreateModal: ReturnType<typeof createQuickCreateModal>;
  erpAuthApi: ReturnType<typeof createErpAuthApi>;
  erpHealthApi: ReturnType<typeof createErpHealthApi>;
  superAdminAuthApi: ReturnType<typeof createSuperAdminAuthApi>;
  erpApi: ReturnType<typeof createErpApiClient>;
  authenticatedErpApi: ReturnType<typeof createErpApiClient>;
  thinkspaceTaskApi: ReturnType<typeof createThinkspaceTaskApi>;
  thinkspaceAgendaApi: ReturnType<typeof createThinkspaceAgendaApi>;
  erpAccessToken: string;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(createLoginPage(page));
  },

  appShell: async ({ page }, use) => {
    await use(createAppShellPage(page));
  },

  taskPage: async ({ page }, use) => {
    await use(createTaskPage(page));
  },

  taskDetailModal: async ({ page }, use) => {
    await use(createTaskDetailModal(page));
  },

  quickCreateModal: async ({ page }, use) => {
    await use(createQuickCreateModal(page));
  },

  erpAuthApi: async ({ request }, use) => {
    await use(createErpAuthApi(request));
  },

  erpHealthApi: async ({ request }, use) => {
    await use(createErpHealthApi(request));
  },

  superAdminAuthApi: async ({ request }, use) => {
    await use(createSuperAdminAuthApi(request));
  },

  erpApi: async ({ request }, use) => {
    await use(createErpApiClient(request));
  },

  erpAccessToken: async ({ erpAuthApi }, use) => {
    if (!hasErpCredentials()) {
      test.skip(true, 'ERP credentials not configured');
    }
    const { username, password } = getErpCredentials();
    const tokens = await erpAuthApi.obtainToken(username, password);
    await use(tokens.access);
  },

  authenticatedErpApi: async ({ request, erpAccessToken }, use) => {
    await use(createErpApiClient(request).withAuth(erpAccessToken));
  },

  thinkspaceTaskApi: async ({ request, erpAccessToken }, use) => {
    await use(createThinkspaceTaskApi(request, erpAccessToken));
  },

  thinkspaceAgendaApi: async ({ request, erpAccessToken }, use) => {
    await use(createThinkspaceAgendaApi(request, erpAccessToken));
  },
});

export { expect };

export async function persistErpAuthSession(username: string, password: string): Promise<void> {
  const { request } = await import('@playwright/test');
  const api = createErpAuthApi(await request.newContext());
  const tokens = await api.obtainToken(username, password);
  const origin = new URL(e2eConfig.erp.uiBaseUrl).origin;
  const storageState = buildPlaywrightStorageState(tokens, origin, username);
  saveJsonFile(getErpAuthStoragePath(), storageState);
  logger.info('ERP auth storage state saved', { path: getErpAuthStoragePath() });
}

export function skipIfNoErpCredentials(): void {
  if (!hasErpCredentials()) {
    test.skip(true, 'Set E2E_ERP_USERNAME and E2E_ERP_PASSWORD to run authenticated tests');
  }
}

export function skipIfAuthStorageMissing(): void {
  if (!authStorageExists()) {
    test.skip(true, 'ERP auth storage state missing — run auth setup project first');
  }
}
