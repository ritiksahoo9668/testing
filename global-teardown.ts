import type { FullConfig } from '@playwright/test';
import { createLogger } from './src/utils/logger.js';

const logger = createLogger('global-teardown');

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  logger.info('Playwright global teardown complete');
}
