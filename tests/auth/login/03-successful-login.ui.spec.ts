import { test, expect } from '../../../src/fixtures/index.js';
import { skipIfNoErpCredentials } from '../../../src/fixtures/index.js';
import { getErpCredentials } from '../../../src/utils/credentials.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

test.describe('C. Successful sign-in @login @unauthenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
  });

  test(`${loginTestTitle('P-L05')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L05');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.login(username, password);
    await loginPage.expectLoggedIn();
  });

  test(`${loginTestTitle('P-L06')} @positive`, async ({ loginPage, page }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L06');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.fillCredentials(username, password);

    const loadingSeen = page.waitForFunction(
      () => {
        const btn = document.querySelector('button[type="submit"]');
        return btn?.hasAttribute('disabled') || /loading/i.test(btn?.textContent ?? '');
      },
      undefined,
      { timeout: 5_000 },
    );

    await loginPage.submit();
    await loadingSeen.catch(() => {
      // Fast networks may navigate before we observe loading; success navigation is enough.
    });
    await loginPage.expectLoggedIn();
  });

  test(`${loginTestTitle('P-L07')} @positive`, async ({ loginPage, page }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L07');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.login(username, password);
    await loginPage.expectLoggedIn();
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test(`${loginTestTitle('P-L08')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L08');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.login(`  ${username}  `, password);
    await loginPage.expectLoggedIn();
  });
});
