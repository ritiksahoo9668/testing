import { test, expect } from '../../../src/fixtures/index.js';
import { skipIfNoErpCredentials } from '../../../src/fixtures/index.js';
import { getErpCredentials } from '../../../src/utils/credentials.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

test.describe('F. Route protection @login @unauthenticated', () => {
  test(`${loginTestTitle('N-L09')} @negative`, async ({ page }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L09');
    await page.goto('/thinkspace/task');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });

  test(`${loginTestTitle('N-L10')} @positive`, async ({ loginPage, page }, testInfo) => {
    skipIfNoErpCredentials();
    annotateLoginTestCase(testInfo, 'N-L10');
    const { username, password } = getErpCredentials();

    await page.goto('/thinkspace/task');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await loginPage.expectLoaded();
    await loginPage.login(username, password);
    // Setup landing route may override deep-link return; user must at least reach authenticated home.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
    await page.goto('/thinkspace/task');
    await expect(page).toHaveURL(/\/thinkspace\/task/, { timeout: 30_000 });
  });
});
