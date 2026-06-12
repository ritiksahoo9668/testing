import { test, expect } from '../../../src/fixtures/index.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

test.describe('A. Page load & layout @login @unauthenticated', () => {
  test(`${loginTestTitle('P-L01')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L01');
    await loginPage.open();
    await loginPage.expectTitleVisible();
    await expect(loginPage.usernameField).toBeVisible();
    await expect(loginPage.passwordField).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.pushHint).toBeVisible();
  });

  test(`${loginTestTitle('P-L02')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L02');
    await loginPage.open();
    await expect(loginPage.usernameField).toHaveAttribute('required', '');
    await expect(loginPage.usernameField).toHaveAttribute('autocomplete', 'username');
    await expect(loginPage.page.getByLabel(/email or username/i)).toBeVisible();
  });

  test(`${loginTestTitle('P-L03')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L03');
    await loginPage.open();
    await expect(loginPage.passwordField).toHaveAttribute('type', 'password');
    await expect(loginPage.passwordField).toHaveAttribute('autocomplete', 'current-password');
  });

  test(`${loginTestTitle('P-L04')} @positive`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'P-L04');
    await loginPage.open();
    const href = await loginPage.forgotPasswordLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/forgot-password/);
    expect(href).toMatch(/127\.0\.0\.1|localhost|5173/);
  });
});
