import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';
import { getActionDataset } from '../../../src/data/thinkspace/load-test-data.js';

test.describe('F. Lifecycle & status @thinkspace @authenticated', () => {
  test.setTimeout(180_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-F01')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-F01');
    const taskId = await thinkspace.createTestTask({ task_title: uniqueTaskTitle('Mark done') });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.markDone();
    thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== taskId);
  });

  test(`${testTitle('P-F04')} @positive`, async ({ taskPage, taskDetailModal, thinkspace }, testInfo) => {
    annotateTestCase(testInfo, 'P-F04');
    const ds = getActionDataset('TS-A10');
    const taskId = await thinkspace.createTestTask({
      task_title: uniqueTaskTitle(ds.apiPayload!.task_title),
    });

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.deleteTask();
    thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== taskId);
  });

  test(`${testTitle('P-F05')} @positive`, async (
    { taskPage, taskDetailModal, thinkspace, thinkspaceTaskApi },
    testInfo,
  ) => {
    annotateTestCase(testInfo, 'P-F05');
    const ds = getActionDataset('TS-A01');
    const title = uniqueTaskTitle('E2E Lifecycle');

    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    await taskPage.quickCreate.fillAndSubmit(title, { description: ds.apiPayload!.task_details });
    await taskPage.expectActionCreatedToast();

    let taskId = 0;
    await expect
      .poll(async () => {
        const found = await thinkspaceTaskApi.findTaskByTitle(title);
        taskId = found?.id ?? 0;
        return taskId;
      }, { timeout: 30_000 })
      .toBeGreaterThan(0);
    thinkspace.createdTaskIds.push(taskId);

    await taskPage.openTaskById(taskId);
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.updateDescription(`Lifecycle ${Date.now()}`);
    await taskDetailModal.setProgressAndSave(75);
    await taskDetailModal.deleteTask();
    thinkspace.createdTaskIds = thinkspace.createdTaskIds.filter((id) => id !== taskId);
  });
});
