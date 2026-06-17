import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';

test.describe('G. Analytics @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH25')} @positive`, async ({ thoughtAnalyticsPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH25');
    await thoughtAnalyticsPage.open();
    await thoughtAnalyticsPage.expectLoaded();
    await thoughtAnalyticsPage.expectStatsVisible();
  });

  test(`${thoughtTestTitle('P-TH26')} @positive`, async ({ thoughtAnalyticsPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH26');
    await thoughtAnalyticsPage.open();
    await thoughtAnalyticsPage.expectLoaded();
    await thoughtAnalyticsPage.runGlobalSearch('meeting');
    await expect(thoughtAnalyticsPage.page.locator('ul')).toBeVisible();
  });
});
