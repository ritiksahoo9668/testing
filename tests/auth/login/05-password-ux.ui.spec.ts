import { test, expect } from '../../../src/fixtures/index.js';
import { skipIfNoErpCredentials } from '../../../src/fixtures/index.js';
import { getErpCredentials } from '../../../src/utils/credentials.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

test.describe('E. Password UX @login @unauthenticated', () => {
  test(`${loginTestTitle('P-L09')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L09');
    await loginPage.open();
    await loginPage.passwordField.fill('SecretPass@1');
    await expect(loginPage.passwordField).toHaveAttribute('type', 'password');

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordField).toHaveAttribute('type', 'text');
    await expect(loginPage.passwordToggle).toHaveAttribute('aria-pressed', 'true');

    await loginPage.togglePasswordVisibility();
    await expect(loginPage.passwordField).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordToggle).toHaveAttribute('aria-pressed', 'false');
  });

  test(`${loginTestTitle('P-L10')} @positive`, async ({ loginPage, page }, testInfo) => {
    skipIfNoErpCredentials();
    annotateLoginTestCase(testInfo, 'P-L10');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.fillCredentials(username, password);

    await page.route('**/api/v1/auth/token/', async (route) => {
      await new Promise((r) => setTimeout(r, 1_500));
      await route.continue();
    });

    const submitPromise = loginPage.submit();
    await expect(loginPage.usernameField).toBeDisabled({ timeout: 5_000 });
    await expect(loginPage.passwordField).toBeDisabled();
    await submitPromise;
    await loginPage.expectLoggedIn();
  });
});
