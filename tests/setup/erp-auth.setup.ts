import { test as setup, expect } from '@playwright/test';
import { e2eConfig, hasErpCredentials } from '../../src/config/environment.js';
import { createErpAuthApi } from '../../src/api/ErpAuthApi.js';
import { getErpCredentials } from '../../src/utils/credentials.js';
import {
  buildPlaywrightStorageState,
  getErpAuthStoragePath,
  saveJsonFile,
} from '../../src/utils/storage.js';
import { createLogger } from '../../src/utils/logger.js';

const logger = createLogger('erp-auth-setup');

setup('authenticate ERP user @setup', async ({ request }) => {
  if (!hasErpCredentials()) {
    setup.skip(true, 'ERP credentials not configured — skipping auth setup');
  }

  const { username, password } = getErpCredentials();
  const authApi = createErpAuthApi(request);
  const tokens = await authApi.obtainToken(username, password);

  expect(tokens.access).toBeTruthy();

  const origin = new URL(e2eConfig.erp.uiBaseUrl).origin;
  const storageState = buildPlaywrightStorageState(tokens, origin, username);
  saveJsonFile(getErpAuthStoragePath(), storageState);

  logger.info('ERP authentication storage state created', {
    path: getErpAuthStoragePath(),
    origin,
    username,
  });
});
