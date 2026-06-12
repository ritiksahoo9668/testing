import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { e2eConfig } from '../config/environment.js';
import { createLogger } from './logger.js';

const logger = createLogger('accessibility');

export type AccessibilityScanOptions = {
  disabledRules?: string[];
  includedSelectors?: string[];
  excludedSelectors?: string[];
};

export async function scanAccessibility(page: Page, options: AccessibilityScanOptions = {}) {
  if (!e2eConfig.enableA11y) {
    logger.debug('Accessibility scan skipped (E2E_ENABLE_A11Y=false)');
    return null;
  }

  let builder = new AxeBuilder({ page });

  if (options.disabledRules?.length) {
    builder = builder.disableRules(options.disabledRules);
  }
  if (options.includedSelectors?.length) {
    builder = builder.include(options.includedSelectors);
  }
  if (options.excludedSelectors?.length) {
    builder = builder.exclude(options.excludedSelectors);
  }

  const results = await builder.analyze();
  logger.info('Accessibility scan complete', {
    violations: results.violations.length,
    incomplete: results.incomplete.length,
  });
  return results;
}

export async function assertNoCriticalViolations(page: Page, options?: AccessibilityScanOptions): Promise<void> {
  const results = await scanAccessibility(page, options);
  if (!results) return;

  const critical = results.violations.filter((violation) => violation.impact === 'critical');
  if (critical.length > 0) {
    const summary = critical.map((v) => `${v.id}: ${v.description}`).join('; ');
    throw new Error(`Critical accessibility violations found: ${summary}`);
  }
}
