import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';
import { getActionDataset } from '../../../src/data/thinkspace/load-test-data.js';

test.describe('C. Create action (UI) @thinkspace @authenticated', () => {
  test.setTimeout(120_000);

  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-C01')} @positive`, async ({ taskPage, thinkspace, thinkspaceTaskApi }, testInfo) => {
    annotateTestCase(testInfo, 'P-C01');
    const ds = getActionDataset('TS-A01');
    const title = uniqueTaskTitle(ds.apiPayload!.task_title);

    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    const { taskId } = await taskPage.quickCreate.fillAndSubmit(title, { description: ds.apiPayload!.task_details });
    await taskPage.expectActionCreatedToast();

    const task = taskId
      ? { id: taskId, task_title: title }
      : await thinkspaceTaskApi.findTaskByTitle(title);
    expect(task?.task_title).toBe(title);
    if (task?.id) thinkspace.createdTaskIds.push(task.id);
  });

  test(`${testTitle('P-C03')} @positive`, async (
    { taskPage, taskDetailModal, thinkspace, thinkspaceTaskApi },
    testInfo,
  ) => {
    annotateTestCase(testInfo, 'P-C03');
    const ds = getActionDataset('TS-A07');
    const title = uniqueTaskTitle('E2E Notes');
    const description = ds.apiPayload!.task_details!;

    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    const { taskId } = await taskPage.quickCreate.fillAndSubmit(title, { description });
    await taskPage.expectActionCreatedToast();

    const task = taskId
      ? { id: taskId, task_title: title }
      : await thinkspaceTaskApi.findTaskByTitle(title);
    expect(task?.id).toBeTruthy();
    if (task?.id) {
      thinkspace.createdTaskIds.push(task.id);
      await taskPage.openTaskById(task.id);
      await taskDetailModal.waitForDetailReady();
      await taskDetailModal.expectOpen(task.id);
      await expect(taskDetailModal.descriptionInput).toHaveValue(description);
    }
  });

  test(`${testTitle('N-C01')} @negative`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'N-C01');
    const title = uniqueTaskTitle('Empty title guard');
    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    await taskPage.quickCreate.titleInput.fill('');
    await taskPage.quickCreate.expectCreateDisabled();
    await taskPage.quickCreate.cancel();
  });

  test(`${testTitle('N-C08')} @negative`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'N-C08');
    const title = uniqueTaskTitle('Cancel create');
    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    await taskPage.quickCreate.cancel();
    await expect(taskPage.page.getByText('Action created.')).toHaveCount(0);
  });
});
