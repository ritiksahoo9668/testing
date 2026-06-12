import { test, expect } from '../../../src/fixtures/index.js';
import { getInvalidPhoneUsernames } from '../../../src/data/login/load-login-test-data.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

/**
 * Required UX (not in UI yet): entering a mobile number and moving to the password field
 * must show inline validation on #login-username before Sign in.
 *
 * These tests FAIL (screenshot + video in test-results/) until ui_enterpriseplatform
 * implements onBlur username validation — no UI changes from this testing repo.
 */
test.describe('H. Phone / numeric username — blur validation @login @field-validation @unauthenticated', () => {
  test(`${loginTestTitle('N-L19')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L19');
    await loginPage.open();
    await loginPage.enterUsernameAndFocusPassword('9668123855');
    await loginPage.expectMobileUsernameBlockedOnBlur();
    await expect(loginPage.usernameField).toHaveValue('9668123855');
  });

  test(`${loginTestTitle('N-L12')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L12');
    await loginPage.open();
    await loginPage.enterUsernameAndFocusPassword('9876543210');
    await loginPage.expectMobileUsernameBlockedOnBlur();
  });

  test(`${loginTestTitle('N-L14')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L14');
    await loginPage.open();
    await loginPage.enterUsernameAndFocusPassword('966812');
    await loginPage.expectMobileUsernameBlockedOnBlur();
  });

  for (const { value, reason } of getInvalidPhoneUsernames()) {
    test(`${loginTestTitle('N-L19')} — blur ${value} (${reason}) @negative`, async ({ loginPage }, testInfo) => {
      annotateLoginTestCase(testInfo, 'N-L19');
      await loginPage.open();
      await loginPage.enterUsernameAndFocusPassword(value);
      await loginPage.expectMobileUsernameBlockedOnBlur();
    });
  }
});
