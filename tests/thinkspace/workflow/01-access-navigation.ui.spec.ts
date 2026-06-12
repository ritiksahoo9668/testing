import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';

test.describe('A. Access & navigation @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-A01')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-A01');
    await taskPage.open('/thinkspace/task');
    await taskPage.expectLoaded();
    await taskPage.workMode.expectVisible();
  });

  test(`${testTitle('P-A02')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-A02');
    await taskPage.open('/thinkspace/task');
    await taskPage.switchView('week');
    await expect(taskPage.page).toHaveURL(/view=week/);
    await taskPage.switchView('today');
    await expect(taskPage.page).not.toHaveURL(/view=week/);
  });

  test(`${testTitle('P-A03')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-A03');
    await taskPage.open('/thinkspace/task');
    await taskPage.clickWorkModeAgendaAction();
    await expect(taskPage.workMode.agendaActionButton).toBeVisible();
  });

  test(`${testTitle('P-A04')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-A04');
    const title = `UI Deep link ${Date.now()}`;
    const taskId = await thinkspace.createTestTask({ task_title: title });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.expectOpen(taskId);
    await taskDetailModal.expectTitleVisible(title);
  });
});

test.describe('A. Access & navigation (guest) @thinkspace @unauthenticated', () => {
  test(`${testTitle('N-A01')} @negative`, async ({ page }, testInfo) => {
    annotateTestCase(testInfo, 'N-A01');
    await page.goto('/thinkspace/task');
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
  });
});
