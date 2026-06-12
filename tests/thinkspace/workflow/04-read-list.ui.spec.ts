import { thinkspaceTest as test } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';

test.describe('D. List & filters @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-D01')} @positive`, async ({ taskPage, taskDetailModal, thinkspaceTaskApi }, testInfo) => {
    annotateTestCase(testInfo, 'P-D01');
    const title = uniqueTaskTitle('List row open');

    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    await taskPage.quickCreate.fillAndSubmit(title);
    await taskPage.expectActionCreatedToast();

    await taskPage.openTaskFromListByTitle(title, { reload: true });
    await taskDetailModal.waitForDetailReady();
    await taskDetailModal.expectTitleVisible(title);

    const found = await thinkspaceTaskApi.findTaskByTitle(title);
    if (found?.id) {
      await thinkspaceTaskApi.deleteTask(found.id);
    }
  });
});
