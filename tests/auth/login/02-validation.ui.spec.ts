import { test, expect } from '../../../src/fixtures/index.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

test.describe('B. Client validation @login @unauthenticated', () => {
  test(`${loginTestTitle('N-L01')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L01');
    await loginPage.open();
    await loginPage.passwordField.fill('any-password');
    await loginPage.submit();
    await loginPage.expectValidationError(/email|username|fill|enter/i);
    await loginPage.expectOnLoginPage();
  });

  test(`${loginTestTitle('N-L02')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L02');
    await loginPage.open();
    await loginPage.usernameField.fill('user@example.com');
    await loginPage.submit();
    await loginPage.expectValidationError(/password|fill|enter/i);
    await loginPage.expectOnLoginPage();
  });

  test(`${loginTestTitle('N-L03')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L03');
    await loginPage.open();
    await loginPage.submit();
    await loginPage.expectValidationError(/email|username|fill|enter/i);
    await loginPage.expectOnLoginPage();
  });
});
