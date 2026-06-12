import { test } from '../../../src/fixtures/index.js';
import { skipIfNoErpCredentials } from '../../../src/fixtures/index.js';
import {
  getInvalidLoginPassword,
  getInvalidPhoneUsernames,
} from '../../../src/data/login/load-login-test-data.js';
import { getErpCredentials } from '../../../src/utils/credentials.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

/**
 * Current UI behaviour today: no blur validation; server rejects mobile on Sign in.
 * Optional — not part of default npm test (run with npm run test:login:server-reject).
 */
test.describe('H-b. Phone username — server reject on submit @login @server-reject @unauthenticated', () => {
  test(`${loginTestTitle('N-L11')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L11');
    await loginPage.open();
    await loginPage.fillCredentials('9668123855', getInvalidLoginPassword());
    await loginPage.submit();
    await loginPage.expectLoginRejected();
  });

  test(`${loginTestTitle('N-L13')} @negative`, async ({ loginPage }, testInfo) => {
    skipIfNoErpCredentials();
    annotateLoginTestCase(testInfo, 'N-L13');
    const { password } = getErpCredentials();
    await loginPage.open();
    await loginPage.fillCredentials('9668123855', password);
    await loginPage.submit();
    await loginPage.expectLoginRejected();
  });

  test(`${loginTestTitle('P-L12')} @positive`, async ({ loginPage }, testInfo) => {
    skipIfNoErpCredentials();
    annotateLoginTestCase(testInfo, 'P-L12');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.fillCredentials('9668123855', getInvalidLoginPassword());
    await loginPage.submit();
    await loginPage.expectLoginRejected();
    await loginPage.clearUsername();
    await loginPage.login(username, password);
    await loginPage.expectLoggedIn();
  });

  for (const { value, reason } of getInvalidPhoneUsernames()) {
    test(`${loginTestTitle('N-L11')} — submit ${value} (${reason}) @negative`, async ({ loginPage }, testInfo) => {
      annotateLoginTestCase(testInfo, 'N-L11');
      await loginPage.open();
      await loginPage.fillCredentials(value, getInvalidLoginPassword());
      await loginPage.submit();
      await loginPage.expectLoginRejected();
    });
  }
});
