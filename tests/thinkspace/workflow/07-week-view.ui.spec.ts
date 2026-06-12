import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';

test.describe('G. Week navigation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-G01')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-G01');
    await taskPage.open('/thinkspace/task?view=week');
    await expect(taskPage.page.getByLabel('Previous week')).toBeVisible();
    await expect(taskPage.page.getByLabel('Next week')).toBeVisible();
  });

  test(`${testTitle('P-G02')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-G02');
    await taskPage.open('/thinkspace/task?view=week');
    await taskPage.page.getByLabel('Previous week').click();
    await taskPage.page.getByLabel('Next week').click();
    await expect(taskPage.page).toHaveURL(/view=week/);
  });
});
