import { thoughtTest as test, expect } from '../../../src/fixtures/thought.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateThoughtTestCase, thoughtTestTitle } from '../../../src/utils/thought-test-case.js';

test.describe('A. Thought access & navigation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('P-TH01')} @positive`, async ({ thoughtListPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH01');
    await thoughtListPage.open('/thinkspace/thought');
    await thoughtListPage.expectLoaded();
    await expect(thoughtListPage.page).toHaveURL(/\/thinkspace\/thought/);
  });

  test(`${thoughtTestTitle('P-TH02')} @positive`, async ({ thoughtListPage, thoughtAnalyticsPage }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'P-TH02');
    await thoughtListPage.open('/thinkspace/thought');
    await thoughtListPage.intelligenceLink.click();
    await thoughtAnalyticsPage.expectLoaded();
    await expect(thoughtAnalyticsPage.page).toHaveURL(/\/thinkspace\/thought\/analytics/);
  });
});

test.describe('A. Thought access (guest) @thinkspace @unauthenticated', () => {
  test(`${thoughtTestTitle('N-TH01')} @negative`, async ({ page }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'N-TH01');
    await page.goto('/thinkspace/thought');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});

test.describe('H. Workspace redirect @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${thoughtTestTitle('N-TH04')} @negative`, async ({ page }, testInfo) => {
    annotateThoughtTestCase(testInfo, 'N-TH04');
    await page.goto('/thinkspace/thought/workspace');
    await expect(page).toHaveURL(/\/thinkspace\/thought\/?$/, { timeout: 15_000 });
  });
});
