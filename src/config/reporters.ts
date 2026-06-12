import type { ReporterDescription } from '@playwright/test';
import { e2eConfig, resolveFromRoot } from './environment.js';

export function buildReporters(): ReporterDescription[] {
  const reporters: ReporterDescription[] = [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: resolveFromRoot('reports/json/results.json') }],
    ['junit', { outputFile: resolveFromRoot('reports/junit/results.xml') }],
    [
      'allure-playwright',
      {
        resultsDir: resolveFromRoot('allure-results'),
        suiteTitle: false,
      },
    ],
  ];

  if (e2eConfig.isCI) {
    reporters.push(['github']);
  }

  return reporters;
}
