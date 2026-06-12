import { thinkspaceTest as test, expect } from '../../../src/fixtures/thinkspace.js';
import { skipIfNoErpCredentials, skipIfAuthStorageMissing } from '../../../src/fixtures/index.js';
import { annotateTestCase, testTitle } from '../../../src/utils/test-case.js';
import { uniqueTaskTitle } from '../../../src/data/thinkspace/task-factory.js';
import { getActionDataset } from '../../../src/data/thinkspace/load-test-data.js';

test.describe('B. Bucketlist @thinkspace @authenticated', () => {
  test.beforeEach(() => {
    skipIfNoErpCredentials();
    skipIfAuthStorageMissing();
  });

  test(`${testTitle('P-B01')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-B01');
    const ds = getActionDataset('TS-A03');
    const title = uniqueTaskTitle(ds.bucketPayload!.title);
    await taskPage.open('/thinkspace/task');
    await taskPage.addBucketItem(title);
    await expect(taskPage.bucketRow(title)).toBeVisible();
  });

  test(`${testTitle('P-B02')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-B02');
    await taskPage.open('/thinkspace/task');
    await taskPage.ensureBucketlistOpen();
    await expect(taskPage.bucketlistPanel).toBeVisible();
    await expect(taskPage.bucketInput).toBeVisible();
  });

  test(`${testTitle('P-B03')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-B03');
    const title = uniqueTaskTitle('Bucket Specific flow');
    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Specific');
    await taskPage.quickCreate.expectTitlePrefilled(title);
    await taskPage.quickCreate.cancel();
  });

  test(`${testTitle('P-B04')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-B04');
    const title = uniqueTaskTitle('Bucket Routine flow');
    await taskPage.open('/thinkspace/task');
    await taskPage.openQuickCreateFromBucket(title, 'Routine');
    await taskPage.quickCreate.expectRoutineMode();
    await taskPage.quickCreate.cancel();
  });

  test(`${testTitle('P-B06')} @positive`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'P-B06');
    const title = uniqueTaskTitle('Bucket delete');
    await taskPage.open('/thinkspace/task');
    await taskPage.addBucketItem(title);
    await taskPage.deleteBucketItem(title);
  });

  test(`${testTitle('N-B01')} @negative`, async ({ taskPage }, testInfo) => {
    annotateTestCase(testInfo, 'N-B01');
    await taskPage.open('/thinkspace/task');
    const countBefore = await taskPage.tryAddWhitespaceBucketItem();
    const countAfter = await taskPage.bucketlistPanel.locator('div.rounded-lg.border').count();
    expect(countAfter).toBe(countBefore);
  });
});
