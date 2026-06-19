import { travelTest as test, expect } from '../../../src/fixtures/travel.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTravelTestCase, travelTestTitle } from '../../../src/utils/travel-test-case.js';

test.describe('A. Travel access & navigation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${travelTestTitle('P-TR01')} @positive`, async ({ travelPage }, testInfo) => {
    annotateTravelTestCase(testInfo, 'P-TR01');
    await travelPage.open('/thinkspace/travel');
    await travelPage.expectLoaded();
    await expect(travelPage.page).toHaveURL(/\/thinkspace\/travel/);
  });

  test(`${travelTestTitle('P-TR02')} @positive`, async ({ travelPage }, testInfo) => {
    annotateTravelTestCase(testInfo, 'P-TR02');
    await travelPage.open('/thinkspace/travel');
    await travelPage.backLink.click();
    await expect(travelPage.page).toHaveURL(/\/thinkspace\/?$/);
  });
});

test.describe('A. Travel access (guest) @thinkspace @unauthenticated', () => {
  test(`${travelTestTitle('N-TR01')} @negative`, async ({ page }, testInfo) => {
    annotateTravelTestCase(testInfo, 'N-TR01');
    await page.goto('/thinkspace/travel');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
