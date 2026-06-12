import { test, expect } from '../../../src/fixtures/index.js';
import { skipIfNoErpCredentials } from '../../../src/fixtures/index.js';
import { getInvalidLoginPassword } from '../../../src/data/login/load-login-test-data.js';
import { getErpCredentials } from '../../../src/utils/credentials.js';
import { annotateLoginTestCase, loginTestTitle } from '../../../src/utils/login-test-case.js';

test.describe('D. Invalid credentials @login @unauthenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
  });

  test(`${loginTestTitle('N-L05')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L05');
    const { username } = getErpCredentials();
    await loginPage.open();
    await loginPage.fillCredentials(username, getInvalidLoginPassword());
    await loginPage.submit();
    await loginPage.expectLoginRejected();
  });

  test(`${loginTestTitle('N-L07')} @negative`, async ({ loginPage }, testInfo) => {
    annotateLoginTestCase(testInfo, 'N-L07');
    const { username, password } = getErpCredentials();
    await loginPage.open();
    await loginPage.fillCredentials(username, getInvalidLoginPassword());
    await loginPage.submit();
    await loginPage.expectLoginRejected();

    await loginPage.fillCredentials(username, password);
    await loginPage.submit();
    await loginPage.expectLoggedIn();
  });
});
