import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';
import { getActionDataset } from '../../../src/data/thinkspace/load-test-data.js';

test.describe('E. Detail modal @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-E01')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-E01');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Detail tabs') });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.expectOpen(taskId);

    for (const tab of ['Progress', 'Updates', 'Attachments', 'Hierarchy'] as const) {
      await taskDetailModal.selectTab(tab);
    }
  });

  test(`${testTitle('P-E02')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-E02');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Description edit') });
    const updated = `Updated description ${Date.now()}`;

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.updateDescription(updated);

    await taskPage.page.reload();
    await taskDetailModal.waitForDetailReady();
    await expect(taskDetailModal.descriptionInput).toHaveValue(updated);
  });

  test(`${testTitle('P-E03')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-E03');
    const ds = getActionDataset('TS-A04');
    const taskId = await thinkspace.createTestTask({
      task_title: uniqueTaskTitle(ds.apiPayload!.task_title),
      task_details: ds.apiPayload!.task_details,
    });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.setProgressAndSave(50);
    await expect(taskDetailModal.progressSlider).toHaveValue('50');
  });

  test(`${testTitle('P-E04')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-E04');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Post update') });
    const message = `Progress note ${Date.now()}`;

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.postUpdate(message);
  });

  test(`${testTitle('N-E01')} @negative`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'N-E01');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Empty post') });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.postUpdateInput.fill('');
    await taskDetailModal.expectPostDisabled();
  });
});
